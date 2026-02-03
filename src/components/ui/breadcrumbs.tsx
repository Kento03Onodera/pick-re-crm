import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav className={`flex items-center gap-2 text-sm ${className}`}>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <div key={index} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={`font-medium ${isLast ? "text-gray-900" : "text-gray-500"}`}>
                                {item.label}
                            </span>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
