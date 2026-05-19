import React from 'react'
import { PlusCircle } from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import IncidentForm from './IncidentForm'

const IncidentModal = ({ open, onOpenChange }) => {
  const controlled = open !== undefined;
return (
<Dialog open={controlled ? open : undefined} onOpenChange={controlled ? onOpenChange : undefined}>
      {!controlled && (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-[#292D60] hover:bg-[#3B418F] text-white rounded-2xl px-6 py-6 shadow-lg transition-all font-bold">
            <PlusCircle size={20} />
            Reportar Incidente
          </Button>
        </DialogTrigger>
      )}
      
      {/* Añadimos estilos para ocultar el scrollbar manteniendo la funcionalidad */}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-none rounded-3xl bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Encabezado */}
        <DialogHeader className="bg-[#292D60] p-6 text-white shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-[#D3D6FF] w-2 h-8 rounded-full inline-block mr-1" />
            Nuevo Reporte Urbano
          </DialogTitle>
        </DialogHeader>

        {/* Formulario */}
        <div className="p-2 bg-white">
          <IncidentForm />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default IncidentModal