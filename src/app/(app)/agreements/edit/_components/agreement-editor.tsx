
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useFolders } from '@/lib/folder-provider';
import { useEffect, useState } from 'react';
import type { File } from '@/lib/folder-provider';
import { Loader2, FileWarning, Signature, Type, CalendarDays, CaseSensitive, Mail, Building, Briefcase, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
// Swapped out react-pdf - its internal pdfjs-dist@4 ESM bundles crash
// Webpack with "Object.defineProperty called on non-object". Our shim
// loads pdfjs 3.11.174 UMD from CDN at runtime, bypassing the bundler
// entirely. API is API-compatible with react-pdf (<Document>, <Page>,
// pdfjs.GlobalWorkerOptions) so the rest of this file is unchanged.
import { Document, Page, pdfjs } from '@/components/pdf-shim';

import { useToast } from '@/hooks/use-toast';

// No-op assignment - kept for symmetry with the previous react-pdf code.
// The shim sets the worker URL itself based on the bundled CDN version.
pdfjs.GlobalWorkerOptions.workerSrc = pdfjs.GlobalWorkerOptions.workerSrc;

// Rendered width of each page in the editor (px). Pages render to a canvas
// at this width; the field overlay maps to it 1:1.
const PAGE_WIDTH = 760;

export const fieldTypes = [
  { id: 'signature', name: 'Signature', icon: Signature },
  { id: 'initials', name: 'Initials', icon: Type },
  { id: 'date-signed', name: 'Date Signed', icon: CalendarDays },
  { id: 'name', name: 'Name', icon: CaseSensitive },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'company', name: 'Company', icon: Building },
  { id: 'title', name: 'Title', icon: Briefcase },
  { id: 'text', name: 'Text', icon: Type },
];

export type PlacedField = {
  id: string;
  type: string;
  x: number;
  y: number;
  page: number;
};

function DraggableField({ fieldType }: { fieldType: typeof fieldTypes[0] }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `draggable-${fieldType.id}`,
    data: { type: fieldType.id, fromSidebar: true },
  });
  const Icon = fieldType.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-2 border rounded-md bg-background hover:bg-accent cursor-grab"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{fieldType.name}</span>
    </div>
  );
}

function PlacedFieldComponent({ field, onRemove }: { field: PlacedField, onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: field.id,
        data: { isPlaced: true, page: field.page, id: field.id },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        position: 'absolute' as const,
        left: `${field.x}%`,
        top: `${field.y}%`,
    } : {
        position: 'absolute' as const,
        left: `${field.x}%`,
        top: `${field.y}%`,
    };
    
    const fieldInfo = fieldTypes.find(f => f.id === field.type);
    const Icon = fieldInfo?.icon || Type;

    return (
        <div ref={setNodeRef} style={style} className="z-10 group" {...attributes}>
            <div className="relative flex items-center gap-1.5 px-2 py-1.5 border border-primary bg-blue-100/80 rounded-none shadow-sm">
                <div {...listeners} className="cursor-move">
                    <GripVertical className="h-3.5 w-3.5 text-primary/70" />
                </div>
                <Icon className="h-3.5 w-3.5 text-primary"/>
                <span className="text-xs font-medium text-primary whitespace-nowrap">{fieldInfo?.name}</span>
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemove(field.id)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-none flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                    <span className="text-destructive-foreground">&times;</span>
                </Button>
            </div>
        </div>
    );
}

function DroppablePage({ pageIndex, width, children }: { pageIndex: number, width: number, children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: `page-${pageIndex + 1}`,
    data: { isDropZone: true, pageIndex },
  });

  return (
    // Fixed width so the wrapper hugs the rendered canvas exactly - the
    // absolute field overlay (inset-0) then maps 1:1 to the page, and the
    // % coordinates stay accurate regardless of viewport size.
    <div
      ref={setNodeRef}
      id={`page-container-${pageIndex + 1}`}
      className="relative shadow-lg bg-white shrink-0"
      style={{ width }}
    >
      {/* Subtle page number badge so multi-page agreements are obvious. */}
      <span className="absolute -left-2 -top-2 z-20 rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white shadow">
        {pageIndex + 1}
      </span>
      <Page pageNumber={pageIndex + 1} width={width} renderTextLayer={false} />
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}


export function AgreementEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileId = searchParams.get('fileId');
  const { findDocument, updateFile } = useFolders();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null | undefined>(undefined);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);


  useEffect(() => {
    if (fileId) {
      const foundDoc = findDocument(fileId);
      // findDocument returns `undefined` when the id isn't in the in-memory
      // tree (e.g. page was refreshed after upload - the agreement only
      // lived in client state). Coerce to `null` so the "File not found"
      // branch renders instead of the loading spinner getting stuck.
      setFile(foundDoc ?? null);
      if (foundDoc?.agreementFields) {
        setPlacedFields(foundDoc.agreementFields);
      }
    } else {
      setFile(null);
    }
  }, [fileId, findDocument]);
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active, delta } = event;

    if (!over) return;
  
    const activeData = active.data.current;
    const overData = over.data.current;
  
    // --- Moving an already placed field ---
    if (activeData?.isPlaced) {
      const fieldId = active.id as string;
      setPlacedFields((currentFields) =>
        currentFields.map((f) => {
          if (f.id === fieldId) {
            const overPageNumber = overData?.isDropZone ? overData.pageIndex + 1 : f.page;
            const originalPageContainer = document.getElementById(`page-container-${f.page}`);
            const targetPageContainer = document.getElementById(`page-container-${overPageNumber}`);
            
            if (!originalPageContainer || !targetPageContainer) return f;

            const originalRect = originalPageContainer.getBoundingClientRect();
            const targetRect = targetPageContainer.getBoundingClientRect();

            let newX = f.x + (delta.x / originalRect.width) * 100;
            let newY = f.y + (delta.y / originalRect.height) * 100;
            
            if(overPageNumber !== f.page) {
              const dropPoint = {
                x: event.activatorEvent.clientX - targetRect.left,
                y: event.activatorEvent.clientY - targetRect.top,
              };
              newX = (dropPoint.x / targetRect.width) * 100;
              newY = (dropPoint.y / targetRect.height) * 100;
            }

            return {
              ...f,
              page: overPageNumber,
              x: Math.max(0, Math.min(85, newX)),
              y: Math.max(0, Math.min(95, newY)),
            };
          }
          return f;
        })
      );
      return;
    }
  
    // --- Dropping a new field from the sidebar ---
    if (overData?.isDropZone && activeData?.fromSidebar) {
      const pageIndex = overData.pageIndex;
      const overPageContainer = document.getElementById(`page-container-${pageIndex + 1}`);

      if (!overPageContainer) return;
      
      const pageRect = overPageContainer.getBoundingClientRect();
      const dropPoint = {
        x: event.activatorEvent.clientX - pageRect.left,
        y: event.activatorEvent.clientY - pageRect.top,
      };
      
      const xPercent = (dropPoint.x / pageRect.width) * 100;
      const yPercent = (dropPoint.y / pageRect.height) * 100;

      const newField: PlacedField = {
          id: `field-${Date.now()}`,
          type: activeData.type,
          x: Math.max(0, Math.min(85, xPercent)),
          y: Math.max(0, Math.min(95, yPercent)),
          page: pageIndex + 1,
      };
      setPlacedFields(prev => [...prev, newField]);
    }
  };

  const removeField = (id: string) => {
    setPlacedFields(fields => fields.filter(f => f.id !== id));
  };
  
  const handleSave = () => {
    if (!file) return;
    updateFile(file.id, { agreementFields: placedFields });
    toast({
        title: "Agreement Saved!",
        description: `${file.name} has been updated with your fields.`,
    });
    router.push(`/content-library?fileId=${file.id}`);
  };

  const handleCancel = () => {
    router.push('/agreements');
  };


  if (file === undefined) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (file === null) {
    return <div className="flex h-full w-full items-center justify-center text-red-500">File not found.</div>;
  }

  return (
    <div className="flex flex-col h-full max-h-screen bg-muted/40">
        <header className="flex-shrink-0 bg-background border-b p-4 flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold">Customize</h2>
                <p className="text-muted-foreground text-sm">
                  {file.name}
                  {numPages ? ` · ${numPages} page${numPages > 1 ? 's' : ''}` : ''}
                </p>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
            </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                {/* Single scroll container - was previously two nested
                    overflow containers (main + an inner h-full div) which
                    fought each other and clamped the scroll height to one
                    viewport, so pages 2+ were unreachable. */}
                <main className="flex-1 overflow-y-auto">
                    <Document
                        file={file.contentUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>}
                        error={<div className="flex justify-center py-24 text-destructive items-center gap-2"><FileWarning /> Could not load PDF.</div>}
                        className="flex flex-col items-center gap-6 py-8 px-6"
                    >
                    {Array.from(new Array(numPages), (el, index) => (
                       <DroppablePage
                         key={`page_wrapper_${index + 1}`}
                         pageIndex={index}
                         width={PAGE_WIDTH}
                       >
                          {placedFields.filter(f => f.page === index + 1).map(field => (
                            <PlacedFieldComponent key={field.id} field={field} onRemove={removeField} />
                          ))}
                       </DroppablePage>
                    ))}
                    </Document>
                </main>
                <aside className="w-80 border-l bg-background flex flex-col">
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                        <h3 className="font-semibold">Signature and fields</h3>
                        <div className="space-y-2">
                            {fieldTypes.map(ft => (
                                <DraggableField key={ft.id} fieldType={ft} />
                            ))}
                        </div>
                    </div>
                </aside>
            </DndContext>
        </div>
    </div>
  );
}
