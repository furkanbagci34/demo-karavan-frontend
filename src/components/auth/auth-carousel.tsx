"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Bot, Lightbulb, Globe2 } from "lucide-react";

const CAROUSEL_ITEMS = [
    {
        icon: Bot,
        title: "Yapay Zeka ile İçerik Üretimi",
        description: "FumaGPT ile saniyeler içinde özgün ve kaliteli içerikler oluşturun.",
        gradient: "from-[#FF5F1F] to-[#FF3131]",
        iconColor: "text-white",
    },
    {
        icon: Lightbulb,
        title: "SEO Dostu İçerikler",
        description: "Arama motorları için optimize edilmiş içerikler üretin.",
        gradient: "from-[#FF5F1F] to-[#FF3131]",
        iconColor: "text-white",
    },
    {
        icon: Globe2,
        title: "Çoklu Dil Desteği",
        description: "İstediğiniz dilde içerik oluşturun ve düzenleyin.",
        gradient: "from-[#FF5F1F] to-[#FF3131]",
        iconColor: "text-white",
    },
];

export function AuthCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative h-full w-full overflow-hidden bg-[#F8F8F8]">
            {CAROUSEL_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                    <div
                        key={index}
                        className={cn(
                            "absolute inset-0 h-full w-full transition-opacity duration-1000",
                            index === currentSlide ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <div className="flex h-full flex-col items-center justify-center gap-8 p-10">
                            <div className="relative">
                                <div
                                    className={cn(
                                        "absolute -inset-4 rounded-full blur-xl opacity-75 bg-gradient-to-r",
                                        item.gradient
                                    )}
                                />
                                <div
                                    className={cn(
                                        "relative size-32 rounded-full flex items-center justify-center bg-gradient-to-r",
                                        item.gradient
                                    )}
                                >
                                    <Icon className={cn("size-16", item.iconColor)} strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="mb-4 text-4xl font-bold text-gray-900">{item.title}</h2>
                                <p className="text-lg text-gray-600">{item.description}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                {CAROUSEL_ITEMS.map((_, index) => (
                    <button
                        key={index}
                        className={cn(
                            "h-2 rounded-full bg-gray-300 transition-all",
                            index === currentSlide ? "w-8 bg-[#FF5F1F]" : "w-2"
                        )}
                        onClick={() => setCurrentSlide(index)}
                    />
                ))}
            </div>
        </div>
    );
}
