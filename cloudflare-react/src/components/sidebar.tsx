import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";
import { ScrollArea } from "./ui/scroll-area";

interface NavItem {
    to: string;
    label: string;
}

const navItems: NavItem[] = [
    { to: "/", label: 'Інтсрукція' },
    { to: "/block_one_page", label: "Розрахунок бюджетного фінансування доріг" },
    { to: "/block_two_page", label: "Експлуатаційне утримання дорі" },
    { to: "/block_three_page", label: "Планування ремонтів автомобільних доріг" },
    // { to: "/history", label: "Історія минулих розрахунків" },
]


export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 h-screen relative overflow-hidden">
            {/* Background with animated blobs */}
            <div className="absolute inset-0 bg-white">
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
            <div className="glass-sidebar">
                {/* Content */}
                <div className="relative z-20 h-full flex flex-col p-4">
                    {/* Header */}
                    <div className="p-4 mb-2">
                        <h1 className="text-xl font-medium text-gray-800 tracking-wide">ІАС Дороги</h1>
                        <div className="w-8 h-0.5 bg-gradient-to-r from-gray-400/60 to-transparent mt-2 rounded-full" />
                    </div>

                    {/* Navigation */}
                    <ScrollArea className="flex-1 px-4">
                        <nav className="space-y-2">
                            {navItems.map(({to, label}, index) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={({ isActive}) => cn(
                                        "glass-button group relative block overflow-hidden transform-gpu",
                                        isActive ? "glass-button--active" : ""
                                    )}
                                    style={{
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    {/* Liquid effects */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                                        <div 
                                            className="absolute inset-0 rounded-2xl"
                                            style={{
                                                background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, transparent 70%)',
                                                transform: 'scale(0)',
                                                animation: 'ripple 0.6s ease-out forwards'
                                            }}
                                        />
                                    </div>

                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div 
                                            className="absolute top-0 left-0 w-full h-full"
                                            style={{
                                                background: 'linear-gradient(45deg, transparent 30%, rgba(0,0,0,0.04) 50%, transparent 70%)',
                                                transform: 'translateX(-100%)',
                                                animation: 'shine 1.5s ease-out forwards'
                                            }}
                                        />
                                    </div>

                                    <span className="relative z-10 block px-4 py-3 font-medium tracking-wide text-gray-700">
                                        {label}
                                    </span>
                                </NavLink>
                            ))}
                        </nav>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 px-2">
                            <p>@ 2025 ДП "НІРІ"</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Styles */}
            <style>{`
                :root {
                    --c-glass: #bbbbbc;
                    --c-light: #fff;
                    --c-dark: #000;
                    --glass-reflex-dark: 1;
                    --glass-reflex-light: 1;
                    --saturation: 150%;
                }

                .glass-sidebar {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    border: none;
                    border-radius: 0;
                    background-color: color-mix(in srgb, var(--c-glass) 8%, transparent);
                    backdrop-filter: blur(12px) saturate(var(--saturation));
                    -webkit-backdrop-filter: blur(12px) saturate(var(--saturation));
                    border-right: 1px solid color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 15%), transparent);
                    box-shadow: 
                        inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 8%), transparent),
                        inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent), 
                        inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 50%), transparent), 
                        inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 40%), transparent), 
                        inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 8%), transparent), 
                        inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 15%), transparent), 
                        inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 15%), transparent), 
                        inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 8%), transparent), 
                        0px 1px 5px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 6%), transparent), 
                        0px 6px 16px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 4%), transparent);
                    transition: 
                        background-color 400ms cubic-bezier(1, 0.0, 0.4, 1),
                        box-shadow 400ms cubic-bezier(1, 0.0, 0.4, 1);
                }

                .glass-button {
                    position: relative;
                    display: block;
                    box-sizing: border-box;
                    padding: 0;
                    border: none;
                    border-radius: 1.5rem;
                    background-color: color-mix(in srgb, var(--c-glass) 4%, transparent);
                    backdrop-filter: blur(8px) saturate(var(--saturation));
                    -webkit-backdrop-filter: blur(8px) saturate(var(--saturation));
                    box-shadow: 
                        inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 6%), transparent),
                        inset 1.2px 2px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 50%), transparent), 
                        inset -1px -1px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 40%), transparent), 
                        inset -2px -5px 1px -4px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 30%), transparent), 
                        inset -0.5px 1.5px 2px -0.5px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent), 
                        inset 0px -3px 1px -1px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 8%), transparent), 
                        0px 2px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 6%), transparent);
                    transition: all 600ms cubic-bezier(0.23, 1, 0.32, 1), transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
                    transform: scale(1) translateZ(0);
                }

                .glass-button:hover {
                    transform: scale(1.02) translateZ(0);
                    background-color: color-mix(in srgb, var(--c-glass) 8%, transparent);
                    box-shadow: 
                        inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 10%), transparent),
                        inset 1.5px 2.5px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent), 
                        inset -1.5px -1.5px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 50%), transparent), 
                        inset -2.5px -6px 1px -4px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 35%), transparent), 
                        inset -0.8px 2px 3px -0.5px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 15%), transparent), 
                        inset 0px -4px 1px -1px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent), 
                        0px 3px 6px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 8%), transparent);
                }

                .glass-button:active {
                    transform: scale(0.98) translateZ(0);
                    transition: all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }

                .glass-button--active {
                    transform: scale(1) translateZ(0);
                    background-color: color-mix(in srgb, var(--c-glass) 15%, transparent);
                    box-shadow: 
                        inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 12%), transparent),
                        inset 2px 3px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 70%), transparent), 
                        inset -2px -2px 0px -1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent), 
                        inset -3px -7px 1px -4px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 40%), transparent), 
                        inset -1px 2.5px 4px -0.5px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 18%), transparent), 
                        inset 0px -5px 1px -1px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent), 
                        0px 1px 3px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent);
                }

                @keyframes morph1 {
                    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: translate(0, 0) rotate(0deg); }
                    25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: translate(30px, -50px) rotate(90deg); }
                    50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; transform: translate(-20px, 20px) rotate(180deg); }
                    75% { border-radius: 60% 40% 60% 30% / 40% 40% 60% 50%; transform: translate(50px, 30px) rotate(270deg); }
                }
                
                @keyframes morph2 {
                    0%, 100% { border-radius: 40% 60% 60% 40% / 40% 50% 60% 50%; transform: translate(0, 0) rotate(0deg); }
                    33% { border-radius: 70% 30% 50% 50% / 60% 40% 50% 40%; transform: translate(-30px, 40px) rotate(120deg); }
                    66% { border-radius: 50% 50% 40% 60% / 50% 70% 30% 60%; transform: translate(20px, -30px) rotate(240deg); }
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
            `}</style>
        </aside>
    )
}