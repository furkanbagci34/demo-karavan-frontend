"use client";

// Tipler örnek olarak, ileride genişletilecek
export interface OfferProduct {
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
    imageUrl?: string;
    oldPrice?: number;
}

export interface OfferPdfPreviewProps {
    offerNo: string;
    offerDate: string;
    offerValidUntil: string;
    customerName: string;
    products: OfferProduct[];
    gross: number;
    discount: number;
    net: number;
    vat: number;
    total: number;
    notes?: string;
    hidePricing?: boolean; // Yeni parametre: fiyat bilgilerini gizle
}

async function getBase64FromUrl(url: string): Promise<string | null> {
    try {
        // URL kontrolü
        if (!url || url === "/images/no-image-placeholder.svg") {
            return null;
        }

        // Relative URL'leri absolute URL'e çevir
        let absoluteUrl = url;
        if (url.startsWith("/")) {
            absoluteUrl = `${window.location.origin}${url}`;
        }

        const response = await fetch(absoluteUrl);

        if (!response.ok) {
            console.warn(`Image fetch failed for ${url}: ${response.status} ${response.statusText}`);
            return null;
        }

        const blob = await response.blob();

        // Blob tipini kontrol et
        if (!blob.type.startsWith("image/")) {
            console.warn(`Invalid image type for ${url}: ${blob.type}`);
            return null;
        }

        return new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (result && result.startsWith("data:image/")) {
                    resolve(result);
                } else {
                    console.warn(`Invalid base64 result for ${url}`);
                    resolve(null);
                }
            };
            reader.onerror = () => {
                console.warn(`FileReader error for ${url}`);
                resolve(null);
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn(`Error processing image ${url}:`, error);
        return null;
    }
}

export async function generateOfferPdf({
    offerNo,
    offerDate,
    offerValidUntil,
    products,
    gross,
    discount,
    net,
    vat,
    total,
    notes,
    hidePricing = false, // Varsayılan olarak false
}: OfferPdfPreviewProps): Promise<void> {
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const pdfFonts = await import("pdfmake/build/vfs_fonts");
    pdfMake.vfs = pdfFonts.default.vfs;

    // Ürün görsellerini base64'e çevir
    const productImages: (string | null)[] = await Promise.all(
        products.map(async (p) => {
            if (p.imageUrl) {
                try {
                    return await getBase64FromUrl(p.imageUrl);
                } catch (error) {
                    console.warn(`Failed to process image for product ${p.name}:`, error);
                    return null;
                }
            }
            return null;
        })
    );

    // PNG logo için base64 - hata durumunda null döndür
    let logoBase64: string | null = null;
    try {
        logoBase64 = await getBase64FromUrl("/images/demonte-icon.png");
    } catch (error) {
        console.warn("Failed to load logo:", error);
    }

    // Tablo başlıklarını ve içeriğini hidePricing parametresine göre ayarla
    const tableWidths = hidePricing ? [20, 60, "*", 50] : [20, 60, "*", 50, 70, 80];

    const tableBody = [
        // Header row
        hidePricing
            ? [
                  { text: "", alignment: "center" },
                  { text: "", alignment: "center" },
                  { text: "Ürün İsmi", alignment: "center" },
                  { text: "Miktar", alignment: "center" },
              ]
            : [
                  { text: "", alignment: "center" },
                  { text: "", alignment: "center" },
                  { text: "Ürün İsmi", alignment: "center" },
                  { text: "Miktar", alignment: "center" },
                  { text: "Fiyat", alignment: "center" },
                  { text: "Tutar (KDV Hariç)", alignment: "center", noWrap: true },
              ],
        // Data rows
        ...products.map((p, i) => {
            const baseRow = [
                { text: (i + 1).toString(), fontSize: 9, alignment: "center", margin: [0, 12, 0, 0] },
                productImages[i]
                    ? { image: productImages[i], width: 50, height: 50, alignment: "center" }
                    : { text: "", width: 50, height: 50 },
                { text: p.name, fontSize: 12, bold: true, alignment: "center", margin: [0, 8, 0, 0] },
                { text: `${p.quantity} adet`, alignment: "center", fontSize: 10 },
            ];

            if (!hidePricing) {
                baseRow.push(
                    {
                        stack: [
                            p.oldPrice
                                ? {
                                      text: `€ ${p.oldPrice.toFixed(2)}`,
                                      decoration: "lineThrough",
                                      fontSize: 9,
                                      color: "#444",
                                      alignment: "center",
                                      margin: [0, 0, 0, 0],
                                  }
                                : "",
                            {
                                text: `€ ${p.price.toFixed(2)}`,
                                fontSize: 10,
                                alignment: "center",
                                bold: !!p.oldPrice,
                                margin: [0, 0, 0, 0],
                            },
                        ].filter(Boolean),
                        alignment: "center",
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,
                    {
                        text: `€ ${p.total.toFixed(2)}`,
                        alignment: "center",
                        fontSize: 10,
                        bold: true,
                        margin: [0, 0, 0, 0],
                    }
                );
            }

            return baseRow;
        }),
    ];

    // Özet tablosunu hidePricing parametresine göre ayarla
    const summaryTableBody: (string | { text: string; bold: boolean })[][] = [
        ["Brüt", `€ ${gross.toFixed(2)}`],
    ];
    
    // İndirim varsa ekle
    if (discount > 0) {
        summaryTableBody.push(["İndirim", `€ ${discount.toFixed(2)}`]);
    }
    
    summaryTableBody.push(
        ["Net", `€ ${net.toFixed(2)}`],
        ["KDV (%20)", `€ ${vat.toFixed(2)}`],
        ["Toplam", { text: `€ ${total.toFixed(2)}`, bold: true }]
    );
    
    const summaryTable = {
        body: summaryTableBody,
    };

    const docDefinition = {
        content: [
            {
                columns: [
                    [
                        { text: "DEMONTE KARAVAN SANAYİ VE TİC A.Ş", style: "companyTitle", margin: [0, 0, 0, 2] },
                        { text: "Ziya Gökalp Mahallesi Abdullahpaşa Caddesi", fontSize: 9, margin: [0, 0, 0, 0] },
                        { text: "Prestij İş Merkezi No:41/2", fontSize: 9, margin: [0, 0, 0, 0] },
                        { text: "Başakşehir/İstanbul", fontSize: 9, margin: [0, 0, 0, 0] },
                    ],
                    logoBase64
                        ? {
                              width: 60,
                              image: logoBase64,
                              fit: [60, 60],
                              alignment: "right",
                              margin: [0, 0, 0, 0],
                          }
                        : { width: 60, text: "" },
                ],
                margin: [0, 0, 0, 10],
            },
            { text: "PROJE TEKLİF FORMU", style: "title", margin: [0, 10, 0, 4], alignment: "center" },
            // Başlığın hemen altında sağa hizalı tarih/geçerlilik/no
            {
                columns: [
                    { width: "*", text: "" },
                    {
                        width: "auto",
                        table: {
                            body: [
                                [
                                    { text: "Tarih:", bold: true, alignment: "right", fontSize: 10 },
                                    { text: offerDate, alignment: "right", fontSize: 10 },
                                ],
                                [
                                    { text: "Geçerlilik:", bold: true, alignment: "right", fontSize: 10 },
                                    { text: offerValidUntil, alignment: "right", fontSize: 10 },
                                ],
                                [
                                    { text: "No:", bold: true, alignment: "right", fontSize: 10 },
                                    { text: offerNo, alignment: "right", fontSize: 10 },
                                ],
                            ],
                        },
                        layout: "noBorders",
                        margin: [0, 0, 0, 10],
                    },
                ],
                alignment: "right",
            },
            { text: notes || "", bold: true, fontSize: 11, margin: [0, 0, 0, 6] },
            {
                text: "Demonte Karavan olarak, TSE ve TÜV testlerinden geçmiş, güvenilir ve dayanıklı ürünler ile en yüksek standartlarda üretim yapıyoruz. Karavanlarımızı, ithal bileşenler kullanarak hazırlıyor ve sektörün en iyi markalarıyla çalışıyoruz. Ayrıca, SCA, Vbair ve Stide markalarının yetkili satış ve servis noktası olarak, yalnızca en kaliteli ürünleri sunmakla kalmıyor, satış sonrası destek ve garanti kapsamında da profesyonel hizmet sağlıyoruz.",
                fontSize: 9,
                margin: [0, 0, 0, 4],
            },
            {
                text: "Size özel hazırlanan bu teklifin, güvenli ve konforlu yolculuklarınız için mükemmel bir başlangıç olmasını diliyoruz. Birlikte çalışmak ve hayallerinizdeki karavanı hayata geçirmek için sabırsızlanıyoruz!",
                fontSize: 9,
                bold: true,
                margin: [0, 0, 0, 10],
            },
            {
                table: {
                    headerRows: 1,
                    widths: tableWidths,
                    body: tableBody,
                },
                layout: {
                    defaultBorder: true,
                    paddingTop: function () {
                        return 8;
                    },
                    paddingBottom: function () {
                        return 8;
                    },
                    paddingLeft: function () {
                        return 4;
                    },
                    paddingRight: function () {
                        return 4;
                    },
                    hLineWidth: function () {
                        return 1;
                    },
                    vLineWidth: function () {
                        return 0;
                    },
                    hLineColor: function () {
                        return "#bbb";
                    },
                },
                margin: [0, 10, 0, 10],
            },
            {
                columns: [
                    {},
                    {
                        width: "auto",
                        table: summaryTable,
                        layout: "noBorders",
                    },
                ],
            },
            {
                ul: [
                    { text: "Geçerlilik Süresi: Teklifimiz 15 gün boyunca geçerlidir.", bold: true },
                    {
                        text: "Yeni Transporter modellerinde DIŞ TENTE stoklara girmediğinden fiyatı ekstra hesaplanacaktır.",
                        decoration: "underline",
                        bold: true,
                    },
                    {
                        text: "Gizlilik: Bu teklif yalnızca size özeldir ve üçüncü şahıs veya firmalarla paylaşılmamalıdır.",
                        bold: true,
                    },
                    {
                        text: "Proje Başlangıcı: Teklifimiz, toplam bedelin %50'sinin banka hesabımıza peşinat olarak yatırılması ile başlar. Teklifin kabul edilmesini takiben satış sözleşmesi hazırlanır ve imzalanmasıyla birlikte üretim süreci başlar. Ürününüz, sözleşmede belirtilen tarihte teslim edilir.",
                        bold: true,
                    },
                    {
                        text: "Garanti: Ürünlerimiz 3 yıl montaj ve imalat hatalarına karşı üretici garantisi ve 2 yıl ithalatçı garantisi kapsamındadır. Garanti şartları, kullanım kılavuzunda detaylandırılmıştır.",
                        bold: true,
                    },
                    {
                        text: "Revizyon: Teklif içeriğinde yapılacak herhangi bir değişiklik, yeni bir teklif oluşturulmasını gerektirebilir.",
                        bold: true,
                    },
                    {
                        text: "Ödeme Koşulları: Ödeme planı siparişe özel olarak belirlenir ve karşılıklı mutabakat sağlanarak yazılı hale getirilir.",
                        bold: true,
                    },
                    {
                        text: "TSE ve TÜV Giderleri: Karavan projeleri için TSE ve TÜV giderleri teklif bedeline dahil olmayıp, ayrı olarak hesaplanır.",
                        bold: true,
                    },
                    {
                        text: "İptal ve İade: Özel üretim ürünlerde, sipariş onaylandıktan sonra iptal ve iade kabul edilmemektedir.",
                        bold: true,
                    },
                ],
                fontSize: 9,
                margin: [0, 20, 0, 0],
            },
        ],
        styles: {
            header: { fontSize: 16, bold: true },
            title: { fontSize: 14, bold: true, alignment: "center" },
            companyTitle: { fontSize: 12, bold: true },
        },
    };
    const fileName = (notes && notes.trim() ? notes.trim() : "PROJE TEKLİF FORMU") + ".pdf";
    pdfMake.createPdf(docDefinition).open({}, undefined, fileName);
}
