"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

export type BodyPartStatus = "original" | "local_painted" | "painted" | "replaced";

export type BodyPart = {
    key: string;
    label: string;
    status: BodyPartStatus;
    note?: string;
};

const PARTS: BodyPart[] = [
    { key: "front_bumper", label: "Ön Tampon", status: "original" },
    { key: "hood", label: "Motor Kaputu", status: "original" },
    { key: "roof", label: "Tavan", status: "original" },
    { key: "rf_fender", label: "Sağ Ön Çamurluk", status: "original" },
    { key: "rf_door", label: "Sağ Ön Kapı", status: "original" },
    { key: "rr_door", label: "Sağ Arka Kapı", status: "original" },
    { key: "rr_fender", label: "Sağ Arka Çamurluk", status: "original" },
    { key: "lf_fender", label: "Sol Ön Çamurluk", status: "original" },
    { key: "lf_door", label: "Sol Ön Kapı", status: "original" },
    { key: "lr_door", label: "Sol Arka Kapı", status: "original" },
    { key: "lr_fender", label: "Sol Arka Çamurluk", status: "original" },
    { key: "trunk", label: "Bagaj Kapağı", status: "original" },
    { key: "rear_bumper", label: "Arka Tampon", status: "original" },
];

const STATUS_META: Record<BodyPartStatus, { label: string; color: string }> = {
    original: { label: "Orijinal", color: "bg-muted" },
    local_painted: { label: "Lokal Boyalı", color: "bg-orange-400" },
    painted: { label: "Boyalı", color: "bg-blue-500" },
    replaced: { label: "Değişen", color: "bg-red-500" },
};

type Marker = { key: string; x: number; y: number };
const MARKERS: Marker[] = [
    { key: "front_bumper", x: 335, y: 105 },
    { key: "hood", x: 300, y: 100 },
    { key: "roof", x: 210, y: 100 },
    { key: "rf_fender", x: 315, y: 150 },
    { key: "rf_door", x: 265, y: 130 },
    { key: "rr_door", x: 255, y: 70 },
    { key: "rr_fender", x: 315, y: 52 },
    { key: "lf_fender", x: 95, y: 150 },
    { key: "lf_door", x: 150, y: 130 },
    { key: "lr_door", x: 160, y: 70 },
    { key: "lr_fender", x: 100, y: 52 },
    { key: "trunk", x: 80, y: 105 },
    { key: "rear_bumper", x: 65, y: 105 },
];

const DETAIL_OPTIONS: string[] = [
    "Hafif Çizik",
    "Derin Çizik",
    "Hafif Ezik",
    "Dolu Eziği",
    "Sürtme",
    "Taş İzi",
    "Göçük",
    "Kırık / Çatlak",
    "Yırtık",
    "Çıkmayan Leke - Kuş, Ağaç Pisliği",
    "Renk Solması",
    "Güneş Yanığı",
    "Paslanma / Oksitlenme",
    "Mini Onarım / Tamir",
    "Boyasız Göçük Düzeltme",
];

export function VehicleBodyAssessment({
    value,
    onChange,
}: {
    value: BodyPart[] | undefined;
    onChange: (next: BodyPart[]) => void;
}) {
    const parts = useMemo<BodyPart[]>(() => {
        if (value && value.length > 0) return value;
        return PARTS.map((p) => ({ ...p }));
    }, [value]);

    const [noteFor, setNoteFor] = useState<BodyPart | null>(null);
    const setStatus = (key: string, status: BodyPartStatus) => {
        onChange(parts.map((p) => (p.key === key ? { ...p, status } : p)));
    };
    const setNote = (key: string, note: string) => {
        onChange(parts.map((p) => (p.key === key ? { ...p, note } : p)));
    };
    const cycleStatus = (status: BodyPartStatus): BodyPartStatus => {
        const order: BodyPartStatus[] = ["original", "local_painted", "painted", "replaced"];
        const idx = order.indexOf(status);
        return order[(idx + 1) % order.length];
    };
    const handleMarkerClick = (key: string) => {
        // reserved if we want quick cycle; currently popover opens, so do nothing
    };

    const setAllOriginal = (checked: boolean) => {
        if (checked) onChange(parts.map((p) => ({ ...p, status: "original", note: undefined })));
    };

    return (
        <div className="border rounded-lg p-4 space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap">
                {Object.entries(STATUS_META).map(([key, m]) => (
                    <div key={key} className="flex items-center gap-2">
                        <span className={cn("inline-block w-3 h-3 rounded-sm", m.color)} />
                        <span className="text-sm text-muted-foreground">{m.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
                {/* Diagram */}
                <div className="flex items-center justify-center">
                    <div className="relative w-[360px]">
                        <svg viewBox="0 0 420 220" className="w-full h-auto">
                            <rect
                                x="75"
                                y="55"
                                width="270"
                                height="100"
                                rx="20"
                                className="fill-muted/30 stroke-muted-foreground/40"
                            />
                            <rect
                                x="175"
                                y="45"
                                width="70"
                                height="25"
                                rx="12"
                                className="fill-muted/30 stroke-muted-foreground/40"
                            />
                            <rect
                                x="340"
                                y="80"
                                width="20"
                                height="50"
                                rx="8"
                                className="fill-muted/30 stroke-muted-foreground/40"
                            />
                            <rect
                                x="60"
                                y="80"
                                width="20"
                                height="50"
                                rx="8"
                                className="fill-muted/30 stroke-muted-foreground/40"
                            />
                            <circle cx="120" cy="160" r="16" className="fill-muted/30 stroke-muted-foreground/40" />
                            <circle cx="300" cy="160" r="16" className="fill-muted/30 stroke-muted-foreground/40" />
                        </svg>

                        {MARKERS.map((m) => {
                            const part = parts.find((p) => p.key === m.key)!;
                            const meta = STATUS_META[part.status];
                            return (
                                <Popover key={m.key}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() => handleMarkerClick(m.key)}
                                            className={cn(
                                                "absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border bg-white text-xs font-bold",
                                                part.status !== "original" && meta.color,
                                                part.status !== "original"
                                                    ? "text-white border-transparent"
                                                    : "border-muted-foreground/40"
                                            )}
                                            style={{ left: m.x, top: m.y }}
                                            title={`${part.label}: ${STATUS_META[part.status].label}`}
                                        >
                                            +
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72">
                                        <div className="space-y-3">
                                            <div className="font-medium text-sm">{part.label}</div>
                                            <RadioGroup
                                                value={part.status}
                                                onValueChange={(v) => setStatus(part.key, v as BodyPartStatus)}
                                            >
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(
                                                        [
                                                            "original",
                                                            "local_painted",
                                                            "painted",
                                                            "replaced",
                                                        ] as BodyPartStatus[]
                                                    ).map((s) => (
                                                        <label key={s} className="flex items-center gap-2 text-sm">
                                                            <RadioGroupItem value={s} id={`${part.key}-in-${s}`} />
                                                            <span>{STATUS_META[s].label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </RadioGroup>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Detay (Opsiyonel)</Label>
                                                <Select
                                                    value={part.note ?? ""}
                                                    onValueChange={(v) => setNote(part.key, v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seçiniz" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DETAIL_OPTIONS.map((opt) => (
                                                            <SelectItem key={opt} value={opt}>
                                                                {opt}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            );
                        })}
                    </div>
                </div>

                {/* Matrix */}
                <div className="overflow-x-auto">
                    <div className="min-w-[520px]">
                        <div className="grid grid-cols-[1fr_repeat(4,90px)_60px] gap-2 items-center pb-2 border-b text-sm font-medium">
                            <div>&nbsp;</div>
                            <div className="text-center">Orijinal</div>
                            <div className="text-center">Lokal Boyalı</div>
                            <div className="text-center">Boyalı</div>
                            <div className="text-center">Değişen</div>
                            <div className="text-center">Detay</div>
                        </div>

                        {parts.map((p) => (
                            <div
                                key={p.key}
                                className="grid grid-cols-[1fr_repeat(4,90px)_60px] gap-2 items-center py-2 border-b last:border-b-0"
                            >
                                <RadioGroup
                                    value={p.status}
                                    onValueChange={(v) => setStatus(p.key, v as BodyPartStatus)}
                                    className="contents"
                                >
                                    <div className="text-sm">{p.label}</div>
                                    {(["original", "local_painted", "painted", "replaced"] as BodyPartStatus[]).map(
                                        (s) => (
                                            <div key={s} className="flex justify-center">
                                                <RadioGroupItem value={s} id={`${p.key}-${s}`} />
                                            </div>
                                        )
                                    )}
                                    <div className="flex justify-center">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label="Detay"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64">
                                                <Label className="text-xs">Not</Label>
                                                <Input
                                                    value={p.note ?? ""}
                                                    onChange={(e) => setNote(p.key, e.target.value)}
                                                    placeholder="Opsiyonel not"
                                                    className="mt-1"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </RadioGroup>
                            </div>
                        ))}

                        <div className="flex items-center gap-2 pt-3">
                            <Checkbox id="all-original" onCheckedChange={(v) => setAllOriginal(Boolean(v))} />
                            <Label htmlFor="all-original" className="text-sm">
                                Aracımın boyanan ya da değişen parçası yok.
                            </Label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const DEFAULT_BODY_PARTS: BodyPart[] = PARTS;
