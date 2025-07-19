import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface NavItem {
    to: string;
    label: string;
}

const navItems: NavItem[] = [
    { to: "/", label: 'Інтсрукція' },
    { to: "/block_one_page", label: "Розрахунок бюджетного фінансування доріг" },
    { to: "/block_two_page", label: "Експлуатаційне утримання дорі" },
    { to: "/block_three_page", label: "Планування ремонтів автомобільних доріг" },
]


export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 h-screen bg-white p-4 border-r border-black  flex flex-col">
            <div className="p-4 border-b border-black">
                <h1 className="text-xl font-semibold text-gray-800">ІАС Дороги</h1>
            </div>
            <ScrollArea className="flex-1 p-4 border-black">
                <nav className="space-y-2">
                    {navItems.map(({to, label}) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive}) => cn(
                                "flex items-center gap-3 px-4 py-1 rounded-none transition-all duration-200 border",
                                " hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200",
                                isActive 
                                    ? "bg-white text-gray-900 font-medium border-black shadow-sm" 
                                    : "text-gray-700 border-black"
                            )}
                        >   
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </ScrollArea>
            <Separator className="my-2 bg-black" />
            <div className="p-4 text-xs text-gray-500">
                <p>@ 2025 ДП "НІРІ" </p>
            </div>
        </aside>
    )
}