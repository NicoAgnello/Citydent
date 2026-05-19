import { User } from "lucide-react";

export default function AppHeader({ user }) {
  return (
    <header className="bg-[#292D60] px-5 pt-12 pb-5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="bg-[#D3D6FF] w-1.5 h-7 rounded-full inline-block" />
        <h1 className="text-white text-xl font-bold tracking-tight">CityFixer</h1>
      </div>
      {user?.imageUrl ? (
        <img
          src={user.imageUrl}
          alt="avatar"
          className="w-10 h-10 rounded-full border-2 border-[#D3D6FF]/60"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#D3D6FF]/20 border-2 border-[#D3D6FF]/40 flex items-center justify-center">
          <User size={18} className="text-[#D3D6FF]" />
        </div>
      )}
    </header>
  );
}
