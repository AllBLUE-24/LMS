// FILE: src/types/tanstack-table.d.ts

// This imports the original module types
import '@tanstack/react-table'

// This is a TypeScript feature called "declaration merging" or "module augmentation".
// We are telling TypeScript to add our custom property to the existing
// 'ColumnMeta' interface from the '@tanstack/react-table' library.
declare module '@tanstack/react-table' {
  // We define that the 'meta' property on a column can optionally
  // contain our 'updateStatus' function.
  interface ColumnMeta<TData, TValue> {
    updateStatus?: (leadId: string, newStatus: string) => void
  }
}
