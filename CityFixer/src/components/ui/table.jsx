// Tabla HTML estilizada con subcomponentes (shadcn/ui).
// Tiene scroll horizontal automático en pantallas chicas.
//
// Estructura típica:
//   <Table>
//     <TableHeader>
//       <TableRow><TableHead>Columna</TableHead></TableRow>
//     </TableHeader>
//     <TableBody>
//       <TableRow><TableCell>Dato</TableCell></TableRow>
//     </TableBody>
//   </Table>
//
// Se usa en AdminUsuariosTab para mostrar la lista de usuarios.
import * as React from "react"
import { cn } from "@/lib/utils"

function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-gray-100 transition-colors data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-4 align-middle", className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption }
