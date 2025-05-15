import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <aside className="h-screen w-64 bg-muted text-muted-foreground border-r px-4 py-6 hidden md:block">
      <div className="text-xl font-bold mb-6">VHSCloud</div>
      <nav className="space-y-2">
        {links.map(({ name, to, icon: Icon }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}