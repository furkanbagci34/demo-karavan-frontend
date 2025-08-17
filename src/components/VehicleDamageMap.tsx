"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DamageEntry = {
    zone: number;
    type: string;
    note?: string;
};

interface VehicleDamageMapProps {
    value: DamageEntry[];
    onChange: (next: DamageEntry[]) => void;
}

const DAMAGE_TYPES = [
    { value: "cizik", label: "Çizik" },
    { value: "gocuk", label: "GÖÇÜK" },
    { value: "boya", label: "Boya" },
    { value: "degisen", label: "Değişen" },
    { value: "catlak", label: "Çatlak" },
    { value: "parca-eksik", label: "Parça Eksik" },
];

type ZoneRect = { id: number; x: number; y: number; w: number; h: number };

// Zones positioned to mimic the provided 13-zone sketch (1,2,3,4 on top; 6-left, 13-center, 12-right; 7,8,9,10 bottom)
function generateZones(): ZoneRect[] {
    const zones: ZoneRect[] = [];
    const topY = 10;
    const bottomY = 165;
    const marginX = 18;
    const boxW = 80;
    const boxH = 30;

    // Top row (left -> right): 4,3,2,1
    zones.push({ id: 4, x: marginX + 0 * (boxW + 12), y: topY, w: boxW, h: boxH });
    zones.push({ id: 3, x: marginX + 1 * (boxW + 12), y: topY, w: boxW, h: boxH });
    zones.push({ id: 2, x: marginX + 2 * (boxW + 12), y: topY, w: boxW, h: boxH });
    zones.push({ id: 1, x: marginX + 3 * (boxW + 12), y: topY, w: boxW, h: boxH });

    // Middle row: left 6, center 13 large, right 12
    zones.push({ id: 6, x: marginX - 6, y: 60, w: boxW, h: 70 });
    zones.push({ id: 13, x: marginX + 1 * (boxW + 12) - 10, y: 55, w: boxW + 40, h: 80 });
    zones.push({ id: 12, x: marginX + 3 * (boxW + 12) - 4, y: 60, w: boxW, h: 70 });

    // Bottom row (left -> right): 7,8,9,10
    zones.push({ id: 7, x: marginX + 0 * (boxW + 12), y: bottomY, w: boxW, h: boxH });
    zones.push({ id: 8, x: marginX + 1 * (boxW + 12), y: bottomY, w: boxW, h: boxH });
    zones.push({ id: 9, x: marginX + 2 * (boxW + 12), y: bottomY, w: boxW, h: boxH });
    zones.push({ id: 10, x: marginX + 3 * (boxW + 12), y: bottomY, w: boxW, h: boxH });

    return zones;
}

export function VehicleDamageMap({ value, onChange }: VehicleDamageMapProps) {
    const zones = useMemo(() => generateZones(), []);
    const [open, setOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<number | null>(null);
    const [editingType, setEditingType] = useState<string>(DAMAGE_TYPES[0].value);
    const [editingNote, setEditingNote] = useState<string>("");

    const activeByZone = useMemo(() => {
        const map = new Map<number, DamageEntry>();
        value?.forEach((d) => map.set(d.zone, d));
        return map;
    }, [value]);

    const openDialogForZone = (zoneId: number) => {
        const existing = activeByZone.get(zoneId);
        setEditingZone(zoneId);
        setEditingType(existing?.type ?? DAMAGE_TYPES[0].value);
        setEditingNote(existing?.note ?? "");
        setOpen(true);
    };

    const saveDamage = () => {
        if (!editingZone) return;
        const without = (value || []).filter((d) => d.zone !== editingZone);
        const next: DamageEntry[] = [
            ...without,
            { zone: editingZone, type: editingType, note: editingNote || undefined },
        ];
        onChange(next);
        setOpen(false);
    };

    const removeDamage = () => {
        if (!editingZone) return;
        const next = (value || []).filter((d) => d.zone !== editingZone);
        onChange(next);
        setOpen(false);
    };

    return (
        <div className="space-y-3">
            <div className="w-full max-w-2xl mx-auto">
                <svg viewBox="0 0 420 220" className="w-full h-auto">
                    {/* Vehicle silhouette approximation */}
                    <rect
                        x="75"
                        y="55"
                        width="270"
                        height="100"
                        rx="20"
                        className="fill-muted/30 stroke-muted-foreground/40"
                    />
                    {/* Cabin/roof */}
                    <rect
                        x="175"
                        y="45"
                        width="70"
                        height="25"
                        rx="12"
                        className="fill-muted/30 stroke-muted-foreground/40"
                    />
                    {/* Bumpers */}
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
                    {/* Wheels */}
                    <circle cx="120" cy="160" r="16" className="fill-muted/30 stroke-muted-foreground/40" />
                    <circle cx="300" cy="160" r="16" className="fill-muted/30 stroke-muted-foreground/40" />

                    {zones.map((z) => {
                        const active = activeByZone.has(z.id);
                        return (
                            <g key={z.id} onClick={() => openDialogForZone(z.id)} className="cursor-pointer">
                                <rect
                                    x={z.x}
                                    y={z.y}
                                    width={z.w}
                                    height={z.h}
                                    rx={6}
                                    className={cn(
                                        "stroke-2",
                                        active
                                            ? "fill-orange-500/80 stroke-orange-600"
                                            : "fill-white stroke-muted-foreground/40"
                                    )}
                                />
                                <text
                                    x={z.x + z.w / 2}
                                    y={z.y + z.h / 2 + 4}
                                    textAnchor="middle"
                                    className={cn(
                                        "select-none text-[12px] font-semibold",
                                        active ? "fill-white" : "fill-muted-foreground"
                                    )}
                                >
                                    {z.id}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Turuncu: Hasar işaretli</Badge>
                <Badge variant="outline">Beyaz: Hasar yok</Badge>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bölge #{editingZone} için hasar bilgisi</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hasar Türü</Label>
                                <Select value={editingType} onValueChange={setEditingType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAMAGE_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Opsiyonel Etiket</Label>
                                <Input
                                    placeholder="Örn: Derin çizik"
                                    value={editingNote}
                                    onChange={(e) => setEditingNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Not</Label>
                            <Textarea
                                placeholder="Bu bölgeyle ilgili açıklama"
                                value={editingNote}
                                onChange={(e) => setEditingNote(e.target.value)}
                                className="min-h-[90px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="justify-between">
                        <Button type="button" variant="destructive" onClick={removeDamage}>
                            Bu Bölgeyi Temizle
                        </Button>
                        <div className="space-x-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                İptal
                            </Button>
                            <Button type="button" onClick={saveDamage}>
                                Kaydet
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
