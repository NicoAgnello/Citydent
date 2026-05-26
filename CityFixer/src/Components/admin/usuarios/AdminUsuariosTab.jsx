import { useState } from "react";

export default function AdminUsuariosTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRoleTab, setActiveRoleTab] = useState("todos");

  // Definición de las sub-pestañas para los roles
  const ROLE_TABS = [
    { id: "todos", label: "Todos los roles" },
    { id: "user", label: "Ciudadano" },
    { id: "admin", label: "Administrador" },
    { id: "superAdmin", label: "Super Admin" }
  ];

  // Datos mockeados hasta que el backend esté listo
  const mockUsers = [
    { id: 1, name: "Juan Pérez", email: "juan@gmail.com", role: "user" },
    { id: 2, name: "María Gómez", email: "maria@gmail.com", role: "user" },
    { id: 3, name: "Admin Central", email: "admin@cityfixer.com", role: "admin" },
    { id: 4, name: "Super Jefe", email: "super@cityfixer.com", role: "superAdmin" },
  ];

  // Filtrado dual: por búsqueda de texto y por rol seleccionado
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = activeRoleTab === "todos" || user.role === activeRoleTab;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6 bg-[#F8F9FF] min-h-screen">
      
      {/* --- ENCABEZADO Y BUSCADOR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-[24px] shadow-sm border border-[#D3D6FF]/30">
        <h2 className="text-xl font-bold text-[#292D60] shrink-0">
          Gestión de Usuarios
        </h2>
        
        <div className="relative w-full md:w-80 shrink-0">
          <input
            type="text"
            placeholder="Buscar nombre o correo..."
            className="w-full px-4 py-2.5 bg-[#D3D6FF]/40 rounded-xl text-[#292D60] placeholder-[#3B418F]/60 focus:outline-none focus:ring-2 focus:ring-[#3B418F] transition-all border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- SUB-NAVEGACIÓN DE ROLES (FORMATO PESTAÑA) --- */}
      <div className="bg-white border-b border-gray-100 px-2 rounded-xl shadow-sm border border-[#D3D6FF]/30 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {ROLE_TABS.map(({ id, label }) => {
            const active = activeRoleTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveRoleTab(id)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  active
                    ? "border-[#292D60] text-[#292D60]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- LISTA DE USUARIOS EN BLOQUES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="bg-white p-5 rounded-[24px] shadow-sm flex flex-col gap-3 border border-[#D3D6FF]/30 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D3D6FF]/50 flex items-center justify-center text-[#292D60] font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#292D60]">{user.name}</h3>
                    <p className="text-sm text-[#3B418F]">{user.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-[#D3D6FF]/30">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  user.role === 'superAdmin' ? 'bg-[#292D60] text-white' :
                  user.role === 'admin' ? 'bg-[#3B418F] text-white' :
                  'bg-[#D3D6FF] text-[#292D60]'
                }`}>
                  {user.role === 'superAdmin' ? 'Super Admin' : 
                   user.role === 'admin' ? 'Admin' : 'Ciudadano'}
                </span>
                
                <button className="text-xs font-bold text-[#3B418F] hover:text-[#292D60] transition-colors">
                  Editar Rol
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 text-center text-[#3B418F] font-medium bg-white rounded-[24px] border border-[#D3D6FF]/30">
            No se encontraron usuarios.
          </div>
        )}
      </div>

    </div>
  );
}