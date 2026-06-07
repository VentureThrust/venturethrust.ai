'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Folder as FolderIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Folder, useFolders } from '@/lib/folder-provider';
import { useState, useCallback, memo } from 'react';

interface FolderTreeProps {
  folderList: Folder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
}

const FolderTree = memo(function FolderTree({ 
  folderList, 
  selectedFolderId, 
  onFolderSelect 
}: FolderTreeProps) {
  return (
    <>
      {folderList.map((folder) => (
        <Collapsible
          key={folder.id}
          className="w-full"
          defaultOpen={folder.id.endsWith('-root')}
        >
          <div className={cn('pl-4')}>
            <div className="flex items-center group">
              <CollapsibleTrigger asChild className="flex-1 cursor-pointer">
                <div
                  className={cn(
                    'flex items-center gap-2 py-1.5 px-2 rounded-md',
                    selectedFolderId === folder.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                  onClick={() => onFolderSelect(folder.id)}
                >
                  {folder.children && folder.children.length > 0 && (
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  )}
                  <FolderIcon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      folder.children &&
                        folder.children.length > 0
                        ? ''
                        : 'ml-4'
                    )}
                  />
                  <span className="truncate flex-1">{folder.name}</span>
                </div>
              </CollapsibleTrigger>
            </div>
            {folder.children && folder.children.length > 0 && (
              <CollapsibleContent>
                <div className="pl-4 border-l border-muted ml-3">
                  <FolderTree 
                    folderList={folder.children} 
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={onFolderSelect}
                  />
                </div>
              </CollapsibleContent>
            )}
          </div>
        </Collapsible>
      ))}
    </>
  );
});

interface FolderSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFolder: (folder: { id: string; name: string }) => void;
  title?: string;
  description?: string;
}

export function FolderSelectionDialog({
  open,
  onOpenChange,
  onSelectFolder,
  title = 'Select a folder',
  description
}: FolderSelectionDialogProps) {
  const { folders } = useFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleSelect = useCallback(() => {
    if (selectedFolderId) {
      const findFolderById = (
        id: string,
        folderList: Folder[]
      ): Folder | null => {
        for (const folder of folderList) {
          if (folder.id === id) return folder;
          if (folder.children) {
            const found = findFolderById(id, folder.children);
            if (found) return found;
          }
        }
        return null;
      };
      const selectedFolder = findFolderById(selectedFolderId, folders);
      if (selectedFolder) {
        onSelectFolder({ id: selectedFolder.id, name: selectedFolder.name });
        onOpenChange(false);
      }
    }
  }, [selectedFolderId, folders, onSelectFolder, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="h-72">
          <FolderTree 
            folderList={folders} 
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
          />
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedFolderId}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}