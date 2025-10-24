import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { clearAllData } from "@/redux/slices/historySlice";
import { clearAllAppData } from "@/redux/store";
import { persistor } from "@/redux/store";

interface NavItem {
    to: string;
    label: string;
}

const navItems: NavItem[] = [
    { to: "/", label: 'Інструкція' },
    { to: "/block_one_page", label: "Розрахунок бюджетного фінансування доріг" },
    { to: "/block_two_page", label: "Експлуатаційне утримання доріг" },
    { to: "/block_three_page", label: "Планування ремонтів автомобільних доріг" },
    { to: "/history", label: "Історія розрахунків" },
]

export const Sidebar: React.FC = () => {
    const dispatch = useAppDispatch();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleClearAllData = async () => {
        try {
            // Очищаем все данные из Redux
            await dispatch(clearAllData()).unwrap();
            
            // Очищаем все slices
            dispatch(clearAllAppData());
            
            // Очищаем persist store
            await persistor.purge();
            
            // Перезагружаем страницу для полной очистки
            window.location.reload();
        } catch (error) {
            console.error('Ошибка при очистке данных:', error);
        }
    };

    return (
        <>
            {/* Mobile Burger Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed top-4 left-4 z-[60] lg:hidden bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-all"
                aria-label="Toggle Menu"
            >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isSidebarOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

        <aside className={`
            w-80 h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
        `}>
            {/* Background with animated blobs */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-100">
                {/* Morphing blob 1 */}
                <div 
                    className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
                    style={{
                        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.1) 50%, transparent 100%)',
                        animation: 'morph1 15s ease-in-out infinite, float1 20s ease-in-out infinite'
                    }}
                />
                {/* Morphing blob 2 */}
                <div 
                    className="absolute w-80 h-80 rounded-full opacity-8 blur-2xl"
                    style={{
                        background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(59,130,246,0.08) 60%, transparent 100%)',
                        animation: 'morph2 12s ease-in-out infinite, float2 18s ease-in-out infinite',
                        right: '-10%',
                        top: '30%'
                    }}
                />
            </div>

            {/* Main glass container */}
            <div className="glass-sidebar-container">
                {/* Content */}
                <div className="relative z-20 h-full flex flex-col py-6 px-4">
                    {/* Header */}
                    <div className="mb-6 px-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-wide">
                            ІАС Дороги
                        </h1>
                        <div className="glass-divider" style={{ margin: '0.75rem 0' }} />
                    </div>

                    {/* Navigation */}
                    <ScrollArea className="flex-1">
                        <nav className="space-y-6 px-2 pt-1">
                            {navItems.map(({to, label}, index) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={({ isActive }) => cn(
                                        "glass-nav-button group relative block overflow-hidden",
                                        isActive && "glass-nav-button--active"
                                    )}
                                    style={{
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    {/* Liquid ripple effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
                                        <div 
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, transparent 70%)',
                                                transform: 'scale(0)',
                                                animation: 'ripple 0.6s ease-out forwards'
                                            }}
                                        />
                                    </div>

                                    {/* Shine effect */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                        <div 
                                            className="absolute top-0 left-0 w-full h-full rounded-xl"
                                            style={{
                                                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                                                transform: 'translateX(-100%)',
                                                animation: 'shine 1.5s ease-out forwards'
                                            }}
                                        />
                                    </div>

                                    <span className="relative z-10 block px-5 py-4 text-base font-semibold text-gray-700 group-hover:text-gray-900 transition-colors leading-snug">
                                        {label}
                                    </span>
                                </NavLink>
                            ))}
                        </nav>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="mt-6 pt-4 px-1">
                        <div className="glass-divider" style={{ margin: '0 0 1rem 0' }} />
                        
                        {/* Clear Cache Button */}
                        <div className="mb-4">
                            <Button
                                onClick={() => setShowConfirmDialog(true)}
                                variant="destructive"
                                className="w-full glass-clear-button"
                                size="sm"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Очистити всі дані
                            </Button>
                        </div>
                        
                        <div className="glass-badge px-4 py-2 text-center">
                            <span className="text-xs font-medium text-gray-600">© 2025 ДП "НІРІ"</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl border border-red-200">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Підтвердження очищення
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Ця дія незворотна
                                </p>
                            </div>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                Ви впевнені, що хочете очистити <strong>ВСІ ДАНІ</strong>?
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Буде видалено:</strong>
                                </p>
                                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                                    <li>Всі розрахунки з бюджетного фінансування</li>
                                    <li>Всі розрахунки з експлуатаційного утримання</li>
                                    <li>Всі розрахунки з планування ремонтів</li>
                                    <li>Історію сесій</li>
                                    <li>Збережені дані</li>
                                    <li>Налаштування користувача</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmDialog(false)}
                                className="flex-1"
                            >
                                Скасувати
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleClearAllData}
                                className="flex-1"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Очистити все
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Styles */}
            <style>{`
                /* Import glass variables */
                :root {
                    --glass-base: 187 187 188;
                    --glass-light: 255 255 255;
                    --glass-dark: 0 0 0;
                    --glass-content: 34 34 68;
                    --glass-action: 0 82 245;
                    --glass-reflex-dark: 1;
                    --glass-reflex-light: 1;
                    --glass-saturation: 150%;
                    --glass-radius: 0.875rem;
                    --glass-radius-sm: 0.5rem;
                    --glass-blur-strong: 16px;
                    --glass-blur-medium: 10px;
                    --glass-blur-light: 6px;
                    --glass-transition: 300ms cubic-bezier(0.4, 0, 0.2, 1);
                    --glass-transition-fast: 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                /* Sidebar Container */
                .glass-sidebar-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: rgba(var(--glass-base), 0.08);
                    backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturation));
                    -webkit-backdrop-filter: blur(var(--glass-blur-strong)) saturate(var(--glass-saturation));
                    border-right: 1px solid rgba(255, 255, 255, 0.15);
                    box-shadow: 
                        inset 0 0 0 1px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.08)),
                        inset 2px 3px 0 -2px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.6)),
                        inset -2px -2px 0 -2px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.5)),
                        0 4px 12px 0 rgba(0, 0, 0, calc(var(--glass-reflex-dark) * 0.06));
                    transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Navigation Button */
                .glass-nav-button {
                    position: relative;
                    display: block;
                    background: rgba(var(--glass-base), 0.05);
                    backdrop-filter: blur(var(--glass-blur-medium)) saturate(var(--glass-saturation));
                    -webkit-backdrop-filter: blur(var(--glass-blur-medium)) saturate(var(--glass-saturation));
                    border: 1.5px solid rgba(255, 255, 255, 0.12);
                    border-radius: var(--glass-radius);
                    transition: all var(--glass-transition);
                    transform: scale(1) translateZ(0);
                    will-change: transform;
                    box-shadow: 
                        inset 0 0 0 1px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.08)),
                        inset 1.5px 2.5px 0 -1px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.5)),
                        0 2px 4px 0 rgba(0, 0, 0, calc(var(--glass-reflex-dark) * 0.06));
                }

                .glass-nav-button:hover {
                    transform: scale(1.02) translateY(-1px) translateZ(0);
                    background: rgba(var(--glass-base), 0.1);
                    border-color: rgba(255, 255, 255, 0.18);
                    box-shadow: 
                        inset 0 0 0 1px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.12)),
                        inset 2px 3px 0 -1px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.6)),
                        0 4px 8px 0 rgba(0, 0, 0, calc(var(--glass-reflex-dark) * 0.1)),
                        0 0 0 4px rgba(255, 255, 255, 0.05);
                }

                .glass-nav-button:active {
                    transform: scale(0.98) translateZ(0);
                    transition: all var(--glass-transition-fast);
                }

                /* Active Navigation Button */
                .glass-nav-button--active {
                    background: rgba(var(--glass-action), 0.15);
                    border-color: rgba(var(--glass-action), 0.3);
                    box-shadow: 
                        inset 0 0 0 1px rgba(var(--glass-action), 0.25),
                        inset 2px 3px 0 -1px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.7)),
                        inset -2px -2px 0 -1px rgba(255, 255, 255, calc(var(--glass-reflex-light) * 0.6)),
                        0 4px 12px 0 rgba(var(--glass-action), 0.2),
                        0 0 0 3px rgba(var(--glass-action), 0.1);
                }

                .glass-nav-button--active:hover {
                    background: rgba(var(--glass-action), 0.18);
                    border-color: rgba(var(--glass-action), 0.35);
                    transform: scale(1.02) translateY(-1px) translateZ(0);
                }

                .glass-nav-button--active span {
                    color: rgb(var(--glass-action));
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
                    margin: 1rem 0;
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

                .glass-clear-button:active {
                    transform: translateY(0);
                    box-shadow: 
                        0 2px 8px rgba(239, 68, 68, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
                    .glass-sidebar-container,
                    .glass-nav-button {
                        animation: none;
                        transition: none;
                    }
                }
            `}</style>
        </aside>
        </>
    );
}