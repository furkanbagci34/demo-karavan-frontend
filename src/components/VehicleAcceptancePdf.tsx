"use client";

export interface VehicleAcceptancePdfProps {
    title?: string;
    date: string;
    formType?: string;
    plateNumber: string;
    chassisNumber?: string;
    customerName?: string;
    entryKm?: string | number;
    exitKm?: string | number;
    tseEntryDateTime?: string;
    tseExitDateTime?: string;
    deliveryDate?: string;
    description?: string;
    fuelLevel?: number;
    features?: Record<string, boolean> | null;
    damageMarkerCounts?: { cross: number; line: number; total: number };
    damageMarkers?: { x: number; y: number; type: "cross" | "line" | "dot" }[];
    deliveredBy?: string;
    receivedBy?: string;
    signature?: string;
}

async function getBase64FromUrl(url: string): Promise<string | null> {
    try {
        if (!url || url === "/images/no-image-placeholder.svg") return null;
        let absoluteUrl = url;
        if (url.startsWith("/")) absoluteUrl = `${window.location.origin}${url}`;
        const response = await fetch(absoluteUrl);
        if (!response.ok) return null;
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) return null;
        return new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result && result.startsWith("data:image/") ? result : null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function formatDateTimeForDisplay(value?: string | null): string {
    if (!value) return "-";
    // T karakterini boşlukla değiştir (ISO 8601 formatını düzelt)
    return value.replace("T", " ");
}

async function buildVehicleAcceptanceDocDefinition(props: VehicleAcceptancePdfProps) {
    const logoBase64 = await getBase64FromUrl("/images/lovasoftware-icon.png");

    const rows: (string | { text: string; bold?: boolean })[][] = [];
    rows.push(["Müşteri", props.customerName || ""]);
    rows.push(["Tarih", props.date || "-"]);
    const formTypeText =
        props.formType === "yeni_arac" ? "Yeni Araç" : props.formType === "servis" ? "Servis" : props.formType || "-";
    rows.push(["Form Tipi", formTypeText]);
    rows.push(["Plaka", props.plateNumber || "-"]);
    rows.push(["Şase No", props.chassisNumber || "-"]);
    rows.push(["Giriş KM", `${props.entryKm ?? "-"}`]);
    rows.push(["Çıkış KM", `${props.exitKm ?? "-"}`]);
    rows.push(["TSE Kamera Giriş", formatDateTimeForDisplay(props.tseEntryDateTime)]);
    rows.push(["TSE Kamera Çıkış", formatDateTimeForDisplay(props.tseExitDateTime)]);
    rows.push(["Teslim Tarihi", props.deliveryDate || "-"]);

    const featureLabels: { key: string; label: string }[] = [
        { key: "celik_jant", label: "Çelik Jant" },
        { key: "garanti_belgesi", label: "Garanti Belgesi" },
        { key: "jant_kapagi", label: "Jant Kapağı" },
        { key: "koltuk_kilifi", label: "Koltuk Kılıfı" },
        { key: "paspas", label: "Paspas" },
        { key: "ruhsat", label: "Ruhsat" },
        { key: "stepne", label: "Stepne" },
        { key: "trafik_sigortasi", label: "Trafik Sigortası" },
        { key: "trafik_seti", label: "Trafik Seti" },
        { key: "yangin_tupu", label: "Yangın Tüpü" },
        { key: "yedek_anahtar", label: "Yedek Anahtar" },
        { key: "zincir", label: "Zincir" },
        { key: "kriko", label: "Kriko" },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allFeatureRows: any[] = [
        [
            { text: "Özellik", bold: true, alignment: "left" },
            { text: "Var", bold: true, alignment: "center" },
            { text: "Yok", bold: true, alignment: "center" },
        ],
    ];
    featureLabels.forEach((f) => {
        const value = (props.features || ({} as Record<string, boolean>))[f.key];
        const isTrue = !!value;
        allFeatureRows.push([
            { text: f.label, alignment: "left" },
            { text: isTrue ? "X" : "", alignment: "center" },
            { text: !isTrue ? "X" : "", alignment: "center" },
        ]);
    });

    const damageCounts = props.damageMarkerCounts || { cross: 0, line: 0, total: 0 };

    // Yakıt seviye barı (20 kutu) için canvas öğeleri
    const fuelLevelValue = typeof props.fuelLevel === "number" ? Math.max(0, Math.min(20, props.fuelLevel)) : null;
    const fuelCanvas =
        fuelLevelValue != null
            ? Array.from({ length: 20 }).map((_, i) => ({
                  type: "rect",
                  x: i * 12,
                  y: 0,
                  w: 10,
                  h: 10,
                  r: 1,
                  lineColor: i < fuelLevelValue ? "#2563eb" : "#9ca3af",
                  color: i < fuelLevelValue ? "#3b82f6" : "#e5e7eb",
              }))
            : [];

    // Araç görseli + hasar işaretleri kompozit görseli üret
    async function buildDamageMapImage(): Promise<string | null> {
        try {
            const carImageUrl = "/images/arac.svg";
            const carImg = new Image();
            carImg.crossOrigin = "anonymous";
            const canvas = document.createElement("canvas");
            const width = 752;
            const height = 496;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            await new Promise<void>((resolve, reject) => {
                carImg.onload = () => resolve();
                carImg.onerror = () => reject(new Error("Car image load error"));
                carImg.src = carImageUrl.startsWith("/") ? `${window.location.origin}${carImageUrl}` : carImageUrl;
            });

            ctx.drawImage(carImg, 0, 0, width, height);

            const markers = props.damageMarkers || [];
            markers.forEach((m) => {
                const x = m.x;
                const y = m.y;
                if (m.type === "cross") {
                    ctx.strokeStyle = "#ef4444";
                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(x - 12, y - 12);
                    ctx.lineTo(x + 12, y + 12);
                    ctx.moveTo(x + 12, y - 12);
                    ctx.lineTo(x - 12, y + 12);
                    ctx.stroke();
                } else if (m.type === "line") {
                    ctx.strokeStyle = "#2563eb";
                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(x - 14, y);
                    ctx.lineTo(x + 14, y);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = "#64748b";
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            return canvas.toDataURL("image/png");
        } catch {
            return null;
        }
    }

    const damageMapBase64 = await buildDamageMapImage();

    const docDefinition = {
        pageSize: "A4",
        pageMargins: [40, 60, 40, 60],
        content: [
            {
                text: "DEMONTE KARAVAN SANAYİ VE TİC A.Ş",
                style: "companyTitle",
                alignment: "center",
                margin: [0, 0, 0, 2],
            },
            {
                columns: [
                    [{ text: "Araç Kabul Formu", style: "title", margin: [0, 4, 0, 0] }],
                    logoBase64
                        ? { width: 60, image: logoBase64, fit: [60, 60], alignment: "right" }
                        : { width: 60, text: "" },
                ],
                margin: [0, 0, 0, 10],
            },
            {
                table: {
                    headerRows: 0,
                    widths: [120, "*"],
                    body: rows,
                },
                layout: "lightHorizontalLines",
                margin: [0, 0, 0, 8],
            },
            fuelLevelValue != null
                ? {
                      columns: [
                          { text: "Yakıt Seviyesi Göstergesi", fontSize: 10, margin: [0, 0, 10, 0] },
                          {
                              canvas: fuelCanvas,
                              width: 240,
                              height: 12,
                          },
                          {
                              text: `${fuelLevelValue}/20  (%${Math.round((fuelLevelValue / 20) * 100)})`,
                              fontSize: 10,
                              alignment: "right",
                          },
                      ],
                      margin: [0, 0, 0, 8],
                  }
                : {},
            {
                columns: [
                    {
                        width: "auto",
                        stack: [
                            { text: "Araç Hasar Görseli", style: "title", alignment: "center", margin: [0, 0, 0, 4] },
                            damageMapBase64
                                ? { image: damageMapBase64, width: 280, alignment: "center" }
                                : {
                                      text: "Hasar işareti bulunmuyor",
                                      alignment: "center",
                                      italics: true,
                                      color: "#6b7280",
                                  },
                            {
                                columns: [
                                    { text: `Göçük (X): ${damageCounts.cross}`, fontSize: 10, alignment: "center" },
                                    { text: `Çizik (—): ${damageCounts.line}`, fontSize: 10, alignment: "center" },
                                    {
                                        text: `Toplam: ${damageCounts.total}`,
                                        bold: true,
                                        fontSize: 10,
                                        alignment: "center",
                                    },
                                ],
                                margin: [0, 4, 0, 0],
                            },
                        ],
                        margin: [0, 0, 8, 0],
                    },
                    {
                        width: "*",
                        stack: [
                            { text: "Araç Özellikleri", style: "title", margin: [0, 0, 0, 4] },
                            {
                                table: {
                                    headerRows: 1,
                                    widths: ["*", 40, 40],
                                    body: allFeatureRows,
                                },
                                layout: {
                                    hLineColor: "#ddd",
                                    vLineColor: "#eee",
                                },
                            },
                            props.description
                                ? { text: `Açıklama: ${props.description}`, fontSize: 10, margin: [0, 6, 0, 0] }
                                : {},
                        ],
                    },
                ],
                columnGap: 14,
                margin: [0, 0, 0, 8],
                pageBreak: "avoid",
            },
            {
                columns: [
                    {
                        width: "*",
                        stack: [
                            { text: "Teslim Alan", bold: true, fontSize: 11, alignment: "center" },
                            { text: props.receivedBy || "", fontSize: 10, alignment: "center", margin: [0, 2, 0, 0] },
                        ],
                    },
                    {
                        width: "*",
                        stack: [
                            { text: "Teslim Eden", bold: true, fontSize: 11, alignment: "center" },
                            { text: props.deliveredBy || "", fontSize: 10, alignment: "center", margin: [0, 2, 0, 0] },
                            props.signature
                                ? {
                                      image: props.signature,
                                      width: 120,
                                      height: 45,
                                      alignment: "center",
                                      margin: [0, 2, 0, 0],
                                  }
                                : {},
                        ],
                    },
                ],
                columnGap: 40,
                margin: [0, 10, 0, 0],
                pageBreak: "avoid",
            },
        ],
        styles: {
            title: { fontSize: 14, bold: true },
            companyTitle: { fontSize: 12, bold: true },
        },
        defaultStyle: { fontSize: 10, lineHeight: 1.2 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    return docDefinition;
}

export async function generateVehicleAcceptancePdf(props: VehicleAcceptancePdfProps): Promise<void> {
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const pdfFonts = await import("pdfmake/build/vfs_fonts");
    pdfMake.vfs = pdfFonts.default.vfs;

    const docDefinition = await buildVehicleAcceptanceDocDefinition(props);
    const fileName = (props.title?.trim() || "ARAÇ KABUL FORMU") + ".pdf";
    pdfMake.createPdf(docDefinition).open({}, undefined, fileName);
}

export async function generateVehicleAcceptancePdfBase64(props: VehicleAcceptancePdfProps): Promise<string> {
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const pdfFonts = await import("pdfmake/build/vfs_fonts");
    pdfMake.vfs = pdfFonts.default.vfs;

    const docDefinition = await buildVehicleAcceptanceDocDefinition(props);
    return await new Promise<string>((resolve) => {
        pdfMake.createPdf(docDefinition).getBase64((b64: string) => resolve(b64));
    });
}
