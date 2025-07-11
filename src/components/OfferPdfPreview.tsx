"use client";

// Tipler örnek olarak, ileride genişletilecek
export interface OfferProduct {
    id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
    imageUrl?: string;
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
}

function getBase64FromUrl(url: string): Promise<string> {
    return fetch(url)
        .then((response) => response.blob())
        .then(
            (blob) =>
                new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
        );
}

export async function generateOfferPdf({
    offerNo,
    offerDate,
    offerValidUntil,
    customerName,
    products,
    gross,
    discount,
    net,
    vat,
    total,
    notes,
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
                } catch {
                    return null;
                }
            }
            return null;
        })
    );

    // PNG logo için base64
    const logoBase64 = await getBase64FromUrl("/images/demonte-icon.png");

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
                    {
                        width: 60,
                        image: logoBase64,
                        fit: [60, 60],
                        alignment: "right",
                        margin: [0, 0, 0, 0],
                    },
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
                    widths: [20, 60, "*", 50, 70, 80],
                    body: [
                        [
                            { text: "", alignment: "center" },
                            { text: "", alignment: "center" },
                            { text: "Ürün İsmi", alignment: "center" },
                            { text: "Miktar", alignment: "center" },
                            { text: "Fiyat", alignment: "center" },
                            { text: "Tutar (KDV Hariç)", alignment: "center", noWrap: true },
                        ],
                        ...products.map((p, i) => [
                            { text: (i + 1).toString(), fontSize: 9, alignment: "center", margin: [0, 12, 0, 0] },
                            productImages[i]
                                ? { image: productImages[i], width: 50, height: 50, alignment: "center" }
                                : "",
                            { text: p.name, fontSize: 12, bold: true, alignment: "center", margin: [0, 8, 0, 0] },
                            { text: `${p.quantity} adet`, alignment: "center", fontSize: 10 },
                            {
                                stack: [
                                    (p as any).oldPrice
                                        ? {
                                              text: `€ ${(p as any).oldPrice.toFixed(2)}`,
                                              decoration: "lineThrough",
                                              fontSize: 9,
                                              color: "#444",
                                              alignment: "center",
                                          }
                                        : "",
                                    {
                                        text: `€ ${p.price.toFixed(2)}`,
                                        fontSize: 10,
                                        alignment: "center",
                                        bold: !!(p as any).oldPrice,
                                    },
                                ].filter(Boolean),
                                alignment: "center",
                            },
                            { text: `€ ${p.total.toFixed(2)}`, alignment: "center", fontSize: 10, bold: true },
                        ]),
                    ],
                },
                layout: {
                    defaultBorder: true,
                    paddingTop: function (_i: any, _node: any) {
                        return 8;
                    },
                    paddingBottom: function (_i: any, _node: any) {
                        return 8;
                    },
                    paddingLeft: function (_i: any, _node: any) {
                        return 4;
                    },
                    paddingRight: function (_i: any, _node: any) {
                        return 4;
                    },
                    hLineWidth: function (_i: any, _node: any) {
                        return 1;
                    },
                    vLineWidth: function (_i: any, _node: any) {
                        return 0;
                    },
                    hLineColor: function (_i: any) {
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
                        table: {
                            body: [
                                ["Brüt", `€ ${gross.toFixed(2)}`],
                                ["İndirim", `€ ${discount.toFixed(2)}`],
                                ["Net", `€ ${net.toFixed(2)}`],
                                ["KDV (%20)", `€ ${vat.toFixed(2)}`],
                                ["Toplam", { text: `€ ${total.toFixed(2)}`, bold: true }],
                            ],
                        },
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
                        text: "Proje Başlangıcı: Teklifimiz, toplam bedelin %50’sinin banka hesabımıza peşinat olarak yatırılması ile başlar. Teklifin kabul edilmesini takiben satış sözleşmesi hazırlanır ve imzalanmasıyla birlikte üretim süreci başlar. Ürününüz, sözleşmede belirtilen tarihte teslim edilir.",
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
