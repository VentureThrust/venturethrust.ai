
'use client';

import React, { useState, forwardRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { GripVertical, MoreHorizontal, PenSquare, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useSpaces } from '@/lib/spaces-provider';

interface SectionHeaderProps extends React.HTMLAttributes<HTMLTableElement> {
  id: string;
  name: string;
  spaceId: string;
  parentId: string | null;
  index: string;
  isIndexingOff: boolean;
}

export const SectionHeader = forwardRef<HTMLTableRowElement, SectionHeaderProps>(
    ({ id, name, spaceId, parentId, index, isIndexingOff, ...props }, ref) => {
  const { renameItemInSpace, deleteItemFromSpace, addSectionHeaderToSpace, moveItemInSpace } = useSpaces();
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };


  const handleRename = () => {
    if (editingName.trim() && editingName !== name) {
      renameItemInSpace(spaceId, id, editingName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteItemFromSpace(spaceId, id, parentId ?? 'root');
  };
  
  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12 text-center"><Checkbox /></TableCell>
      <TableCell className="w-12 text-center cursor-grab p-0" {...attributes} {...listeners}>
        <div className="flex items-center justify-center h-full w-full">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="text-center text-muted-foreground">{!isIndexingOff && index}</TableCell>
      <TableCell colSpan={4} className="font-semibold text-blue-900">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
              autoFocus
              className="h-8 bg-card border-primary"
            />
          ) : (
            <span className="truncate">{name}</span>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
            <PenSquare className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
       <TableCell className="text-muted-foreground">Section</TableCell>
      <TableCell>
        <div className="flex justify-end">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => moveItemInSpace(spaceId, id, parentId, 'up')}>
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Move up
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => moveItemInSpace(spaceId, id, parentId, 'down')}>
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Move down
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => addSectionHeaderToSpace(spaceId, 'Untitled Section', parentId, 'above', id)}>
                  Section above
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => addSectionHeaderToSpace(spaceId, 'Untitled Section', parentId, 'below', id)}>
                  Section below
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
});

SectionHeader.displayName = 'SectionHeader';
