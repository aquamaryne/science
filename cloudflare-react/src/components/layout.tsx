import { SidebarProvider, SidebarTrigger } from "./ui/sidebar"
import { Sidebar } from "./ui/sidebar"
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}