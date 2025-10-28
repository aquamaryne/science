import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Trash2, AlertTriangle, Home, Calculator, Wrench, Route, History } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { clearAllData } from "@/redux/slices/historySlice";
import { clearAllAppData } from "@/redux/store";
import { persistor } from "@/redux/store";

// ✅ Shadcn/ui Sidebar Components
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface NavItem {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { to: "/", label: 'Інструкція', icon: Home },
    { to: "/block_one_page", label: "Розрахунок бюджетного фінансування доріг", icon: Calculator },
    { to: "/block_two_page", label: "Експлуатаційне утримання доріг", icon: Wrench },
    { to: "/block_three_page", label: "Планування ремонтів автомобільних доріг", icon: Route },
    { to: "/history", label: "Історія розрахунків", icon: History },
];

export const AppSidebar: React.FC = () => {
    const dispatch = useAppDispatch();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleClearAllData = async () => {
        try {
            await dispatch(clearAllData()).unwrap();
            dispatch(clearAllAppData());
            await persistor.purge();
            window.location.reload();
        } catch (error) {
            console.error('Помилка при очищенні даних:', error);
        }
    };

    return (
        <>
            <Sidebar className="glass-sidebar">

                {/* Header */}
                <SidebarHeader className="relative z-10">
                    <div className="px-2 py-2 md:py-3 xl:py-4">
                        <h1 className="text-lg md:text-xl xl:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-wide">
                            ІАС Дороги
                        </h1>
                        <div className="glass-divider mt-2 md:mt-3" />
                    </div>
                </SidebarHeader>

                {/* Content */}
                <SidebarContent className="relative z-10">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu className="space-y-1.5 md:space-y-2">
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.to}>
                                        <NavLink
                                            to={item.to}
                                            className={({ isActive }) => cn(
                                                "w-full",
                                                isActive && "sidebar-active"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <SidebarMenuButton
                                                    className={cn(
                                                        "glass-nav-button group w-full h-auto min-h-[3rem] md:min-h-[3.5rem] py-2 md:py-2.5 px-2.5 md:px-3 flex items-start justify-start",
                                                        isActive && "glass-nav-button--active"
                                                    )}
                                                >
                                                    <item.icon className="relative z-10 h-4 w-4 md:h-5 md:w-5 xl:h-5 xl:w-5 2xl:h-6 2xl:w-6 min-w-[1rem] md:min-w-[1.25rem] mr-2 mt-1 flex-shrink-0" />
                                                    <span className="relative z-10 text-[11px] md:text-xs xl:text-sm 2xl:text-base font-semibold text-gray-700 group-hover:text-gray-900 transition-colors leading-tight md:leading-relaxed text-left flex-1 whitespace-normal break-words">
                                                        {item.label}
                                                    </span>
                                                </SidebarMenuButton>
                                            )}
                                        </NavLink>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                {/* Footer */}
                <SidebarFooter className="relative z-10">
                    <div className="px-2 py-2 md:py-3 xl:py-4">
                        <div className="glass-divider mb-2 md:mb-3 xl:mb-4" />

                        {/* Clear Cache Button */}
                        <Button
                            onClick={() => setShowConfirmDialog(true)}
                            variant="destructive"
                            className="w-full glass-clear-button text-xs md:text-sm xl:text-base py-2 md:py-2.5"
                        >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4 xl:h-4 xl:w-4 mr-1.5 md:mr-2" />
                            Очистити всі дані
                        </Button>
                    </div>
                </SidebarFooter>
            </Sidebar>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Підтвердження очищення
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            <div className="space-y-3">
                                <p className="font-semibold text-gray-900">
                                    Ви впевнені, що хочете видалити всі дані?
                                </p>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                                    <p className="font-medium text-red-900 mb-2">
                                        ⚠️ Будуть видалені:
                                    </p>
                                    <ul className="space-y-1 text-red-800 list-disc list-inside">
                                        <li>Всі збережені розрахунки</li>
                                        <li>Історія сесій</li>
                                        <li>Налаштування</li>
                                        <li>Завантажені дані</li>
                                    </ul>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Цю дію неможливо скасувати. Сторінка перезавантажиться після очищення.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            className="flex-1 sm:flex-none"
                        >
                            Скасувати
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowConfirmDialog(false);
                                handleClearAllData();
                            }}
                            className="flex-1 sm:flex-none"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Так, видалити все
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style>{`
                /* Glass morphism variables */
                :root {
                    --glass-base: 255, 255, 255;
                    --glass-action: 59, 130, 246;
                    --glass-content: 31, 41, 55;
                    --glass-blur-heavy: 24px;
                    --glass-blur-medium: 16px;
                    --glass-blur-light: 8px;
                    --glass-saturation: 180%;
                    --glass-brightness: 1.1;
                    --glass-reflex-light: 0.5;
                    --glass-reflex-dark: 0.25;
                    --glass-radius-lg: 1.5rem;
                    --glass-radius-md: 1rem;
                    --glass-radius-sm: 0.75rem;
                    --glass-transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    --glass-transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Sidebar Base */
                .glass-sidebar {
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    width: 280px;
                    min-width: 280px;
                    background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
                    border-right: 1px solid #e2e8f0;
                }

                /* 1920x1080 и выше (QHD, 4K) */
                @media (min-width: 1920px) {
                    .glass-sidebar {
                        width: 320px;
                        min-width: 320px;
                    }
                }

                /* 2K и выше */
                @media (min-width: 2560px) {
                    .glass-sidebar {
                        width: 360px;
                        min-width: 360px;
                    }
                }

                /* 1600-1920 */
                @media (max-width: 1919px) {
                    .glass-sidebar {
                        width: 270px;
                        min-width: 270px;
                    }
                }

                /* 1366-1600 */
                @media (max-width: 1599px) {
                    .glass-sidebar {
                        width: 250px;
                        min-width: 250px;
                    }
                }

                /* Меньше 1366 */
                @media (max-width: 1365px) {
                    .glass-sidebar {
                        width: 230px;
                        min-width: 230px;
                    }
                }

                /* Navigation Button Base */
                .glass-nav-button {
                    position: relative;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    transition: all 0.2s ease;
                    overflow: visible;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }

                .glass-nav-button:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                /* Active Navigation Button */
                .glass-nav-button--active {
                    background: #dbeafe;
                    border-color: #3b82f6;
                }

                .glass-nav-button--active:hover {
                    background: #bfdbfe;
                    border-color: #2563eb;
                }

                .glass-nav-button--active span {
                    color: #1d4ed8;
                    font-weight: 700;
                }

                /* Divider */
                .glass-divider {
                    height: 1px;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.25) 50%,
                        transparent
                    );
                }

                /* Badge */
                .glass-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    background: rgba(var(--glass-base), 0.12);
                    backdrop-filter: blur(var(--glass-blur-light)) saturate(var(--glass-saturation));
                    -webkit-backdrop-filter: blur(var(--glass-blur-light)) saturate(var(--glass-saturation));
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    border-radius: var(--glass-radius-sm);
                    padding: 0.5rem;
                    color: rgb(var(--glass-content));
                    box-shadow: 
                        inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                        0 1px 3px 0 rgba(0, 0, 0, 0.05);
                }

                /* Clear Button */
                .glass-clear-button {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    border: 2px solid #b91c1c;
                    color: white;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 4px 12px rgba(239, 68, 68, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                }

                .glass-clear-button:hover {
                    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                    border-color: #991b1b;
                    transform: translateY(-1px);
                    box-shadow: 
                        0 6px 16px rgba(239, 68, 68, 0.4),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3);
                }

                /* Animations */
                @keyframes morph1 {
                    0%, 100% { 
                        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; 
                        transform: translate(0, 0) rotate(0deg); 
                    }
                    25% { 
                        border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; 
                        transform: translate(30px, -50px) rotate(90deg); 
                    }
                    50% { 
                        border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; 
                        transform: translate(-20px, 20px) rotate(180deg); 
                    }
                    75% { 
                        border-radius: 60% 40% 60% 30% / 40% 40% 60% 50%; 
                        transform: translate(50px, 30px) rotate(270deg); 
                    }
                }
                
                @keyframes morph2 {
                    0%, 100% { 
                        border-radius: 40% 60% 60% 40% / 40% 50% 60% 50%; 
                        transform: translate(0, 0) rotate(0deg); 
                    }
                    33% { 
                        border-radius: 70% 30% 50% 50% / 60% 40% 50% 40%; 
                        transform: translate(-30px, 40px) rotate(120deg); 
                    }
                    66% { 
                        border-radius: 50% 50% 40% 60% / 50% 70% 30% 60%; 
                        transform: translate(20px, -30px) rotate(240deg); 
                    }
                }
                
                @keyframes float1 {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    25% { transform: translateY(-20px) translateX(10px); }
                    50% { transform: translateY(15px) translateX(-15px); }
                    75% { transform: translateY(-10px) translateX(20px); }
                }
                
                @keyframes float2 {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    30% { transform: translateY(25px) translateX(-20px); }
                    60% { transform: translateY(-15px) translateX(15px); }
                }
                
                @keyframes ripple {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(4); opacity: 0; }
                }
                
                @keyframes shine {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }

                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .glass-nav-button {
                        animation: none;
                        transition: none;
                    }
                }
            `}</style>
        </>
    );
};

// ✅ Wrapper component з SidebarProvider
export const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SidebarProvider>
            <div className="flex w-full">
                <AppSidebar />
                <main className="flex-1 min-h-screen">
                    {/* Trigger button для мобільних пристроїв */}
                    <div className="lg:hidden fixed top-4 left-4 z-50">
                        <SidebarTrigger className="bg-white shadow-lg hover:bg-gray-50 rounded-lg p-2" />
                    </div>
                    <div className="p-4 md:p-6 xl:p-8 2xl:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};