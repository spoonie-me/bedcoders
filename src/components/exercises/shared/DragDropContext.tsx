import { useState, useCallback, useRef, type HTMLAttributes } from 'react';

// ── useDragDrop ── reorder items within a single list ──

interface DragDropResult {
  dragHandlers: (index: number) => Pick<
    HTMLAttributes<HTMLElement>,
    'draggable' | 'onDragStart' | 'onDragOver' | 'onDragEnter' | 'onDrop' | 'onDragEnd' | 'style'
  >;
  isDragging: number | null;
}

export function useDragDrop<T>(
  items: T[],
  onReorder: (items: T[]) => void,
): DragDropResult {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      setDraggingIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (index: number) => (_e: React.DragEvent) => {
      dragOverIndex.current = index;
    },
    [],
  );

  const handleDrop = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      const fromIndex = Number(e.dataTransfer.getData('text/plain'));
      if (isNaN(fromIndex) || fromIndex === index) return;

      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(index, 0, moved);
      onReorder(updated);
      setDraggingIndex(null);
      dragOverIndex.current = null;
    },
    [items, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    dragOverIndex.current = null;
  }, []);

  const dragHandlers = useCallback(
    (index: number) => ({
      draggable: true as const,
      onDragStart: handleDragStart(index),
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter(index),
      onDrop: handleDrop(index),
      onDragEnd: handleDragEnd,
      style: {
        opacity: draggingIndex === index ? 0.4 : 1,
        cursor: 'grab',
        transition: `opacity var(--transition-fast)`,
      } as React.CSSProperties,
    }),
    [draggingIndex, handleDragStart, handleDragOver, handleDragEnter, handleDrop, handleDragEnd],
  );

  return { dragHandlers, isDragging: draggingIndex };
}

// ── useDragToTarget ── drag items from a source list onto target zones ──

interface DragToTargetResult<T> {
  /** Attach to each draggable source item */
  sourceHandlers: (item: T, sourceId: string) => Pick<
    HTMLAttributes<HTMLElement>,
    'draggable' | 'onDragStart' | 'onDragEnd' | 'style'
  >;
  /** Attach to each drop target zone */
  targetHandlers: (targetId: string) => Pick<
    HTMLAttributes<HTMLElement>,
    'onDragOver' | 'onDragEnter' | 'onDragLeave' | 'onDrop' | 'style'
  >;
  /** The item currently being dragged, or null */
  dragging: T | null;
  /** The target zone currently hovered, or null */
  activeTarget: string | null;
}

export function useDragToTarget<T>(
  onDrop: (item: T, sourceId: string, targetId: string) => void,
): DragToTargetResult<T> {
  const [dragging, setDragging] = useState<T | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const dragDataRef = useRef<{ item: T; sourceId: string } | null>(null);

  const sourceHandlers = useCallback(
    (item: T, sourceId: string) => ({
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => {
        dragDataRef.current = { item, sourceId };
        setDragging(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', sourceId);
      },
      onDragEnd: () => {
        setDragging(null);
        setActiveTarget(null);
        dragDataRef.current = null;
      },
      style: {
        cursor: 'grab',
        opacity: dragging === item ? 0.4 : 1,
        transition: `opacity var(--transition-fast)`,
      } as React.CSSProperties,
    }),
    [dragging],
  );

  const targetHandlers = useCallback(
    (targetId: string) => ({
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      },
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        setActiveTarget(targetId);
      },
      onDragLeave: () => {
        setActiveTarget((prev) => (prev === targetId ? null : prev));
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (dragDataRef.current) {
          onDrop(dragDataRef.current.item, dragDataRef.current.sourceId, targetId);
        }
        setDragging(null);
        setActiveTarget(null);
        dragDataRef.current = null;
      },
      style: {
        outline: activeTarget === targetId ? '2px solid var(--signal)' : 'none',
        outlineOffset: '2px',
        transition: `outline var(--transition-fast)`,
      } as React.CSSProperties,
    }),
    [activeTarget, onDrop],
  );

  return { sourceHandlers, targetHandlers, dragging, activeTarget };
}
