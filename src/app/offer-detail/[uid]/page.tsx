"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useOffers, type OfferPublic } from "@/hooks/api/useOffers";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OfferStatus } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarIcon, CheckCircleIcon, XCircleIcon, LoaderIcon, Clock, User } from "lucide-react";

const OfferDetailPage = () => {
    const params = useParams();
    const uid = params?.uid as string;
    const { getContractByUid, updateOfferStatus, loading, error } = useOffers();
    const [offer, setOffer] = useState<OfferPublic | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionResult, setActionResult] = useState<{
        type: "accepted" | "rejected" | null;
        timestamp: string;
    }>({ type: null, timestamp: "" });

    useEffect(() => {
        const fetchOffer = async () => {
            if (uid) {
                try {
                    const contractData = await getContractByUid(uid);
                    setOffer(contractData);
                } catch (err) {
                    console.error("Teklif yüklenirken hata oluştu:", err);
                }
            }
        };

        fetchOffer();
    }, [uid, getContractByUid]);

    const handleAcceptOffer = async () => {
        if (!offer) return;

        setIsUpdating(true);
        try {
            await updateOfferStatus(uid, OfferStatus.ONAYLANDI);
            setOffer({ ...offer, status: OfferStatus.ONAYLANDI });
            setActionResult({
                type: "accepted",
                timestamp: new Date().toLocaleString("tr-TR"),
            });
        } catch (err) {
            console.error("Teklif kabul edilirken hata:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRejectOffer = async () => {
        if (!offer) return;

        setIsUpdating(true);
        try {
            await updateOfferStatus(uid, OfferStatus.REDDEDILDI);
            setOffer({ ...offer, status: OfferStatus.REDDEDILDI });
            setActionResult({
                type: "rejected",
                timestamp: new Date().toLocaleString("tr-TR"),
            });
        } catch (err) {
            console.error("Teklif reddedilirken hata:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const hasActionResult = actionResult.type !== null;
    // Butonlar sadece Taslak, Gönderildi ve Onaylandı durumlarında gösterilsin
    const shouldShowButtons =
        offer?.status === OfferStatus.TASLAK ||
        offer?.status === OfferStatus.GONDERILDI ||
        offer?.status === OfferStatus.ONAYLANDI;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoaderIcon className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
                    <p className="text-gray-600">Teklif yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !offer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <XCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Teklif Bulunamadı</h1>
                    <p className="text-gray-600">Teklif onaylanmış ya da reddedilmiş olabilir.</p>
                </div>
            </div>
        );
    }

    // İşlem başarılı olduysa success message göster
    if (hasActionResult && offer) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header - Full Width */}
                <div className="w-full p-4" style={{ backgroundColor: "#575756" }}>
                    <Image
                        src="/images/demonte-logo-yatay.png"
                        alt="Demonte Karavan"
                        width={400}
                        height={80}
                        className="h-15 object-contain mx-auto mb-3"
                    />
                </div>

                <div className="max-w-4xl mx-auto p-4">
                    <Card className="shadow-lg border border-gray-200 py-2">
                        <CardContent className="p-6 text-center">
                            {actionResult.type === "accepted" ? (
                                <>
                                    <CheckCircleIcon className="mx-auto h-20 w-20 text-green-500 mb-6" />
                                    <h1 className="text-3xl font-bold text-green-700 mb-4">Teşekkür Ederiz!</h1>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-3">
                                            Sözleşme #{offer.offer_number} Başarıyla Onaylandı
                                        </h2>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Onaylanma Tarihi:</strong> {actionResult.timestamp}
                                        </p>
                                        <p className="text-gray-700 mb-4">
                                            <strong>Tutar:</strong> {formatCurrency(offer.total_amount)}
                                        </p>
                                        <Separator className="my-4" />
                                        <div className="space-y-3 text-left">
                                            <h3 className="font-semibold text-gray-900">Sonraki Adımlar:</h3>
                                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                <li>Siparişiniz işleme alınmıştır</li>
                                                <li>En kısa sürede size geri dönüş yapılacaktır</li>
                                                <li>Teslimat tarihi bilgilendirilecektir</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-700">
                                            <strong>İletişim:</strong> Herhangi bir sorunuz için{" "}
                                            <span className="font-semibold">info@demontekaravan.com</span> adresinden
                                            bize ulaşabilirsiniz.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <XCircleIcon className="mx-auto h-20 w-20 text-red-500 mb-6" />
                                    <h1 className="text-3xl font-bold text-red-700 mb-4">Sözleşme Reddedildi</h1>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 mb-3">
                                            Sözleşme #{offer.offer_number} Reddedildi
                                        </h2>
                                        <p className="text-gray-700 mb-2">
                                            <strong>Reddedilme Tarihi:</strong> {actionResult.timestamp}
                                        </p>
                                        <p className="text-gray-700 mb-4">
                                            Sözleşme reddedilmiştir ve işlem sonlandırılmıştır.
                                        </p>
                                        <Separator className="my-4" />
                                        <div className="space-y-3 text-left">
                                            <h3 className="font-semibold text-gray-900">Bilgilendirme:</h3>
                                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                <li>
                                                    Gelecekte yeni sözleşmeler için bizimle iletişime geçebilirsiniz
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-700">
                                            <strong>İletişim:</strong> Yeni sözleşme talepleriniz için{" "}
                                            <span className="font-semibold">info@demontekaravan.com</span> adresinden
                                            bize ulaşabilirsiniz.
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Full Width */}
            <div className="w-full p-4" style={{ backgroundColor: "#575756" }}>
                <Image
                    src="/images/demonte-logo-yatay.png"
                    alt="Demonte Karavan"
                    width={400}
                    height={80}
                    className="h-15 object-contain mx-auto mb-3"
                />
            </div>

            <div className="max-w-4xl mx-auto p-4">
                {/* Ana İçerik - Tek kart, kompakt */}
                <Card className="shadow-lg border border-gray-200 py-2">
                    <CardContent className="p-4">
                        <div className="text-center mb-4">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Teklif #{offer.offer_number}</h1>
                            <Badge
                                className={`px-5 py-2 font-semibold text-lg ${
                                    offer.status === OfferStatus.ONAYLANDI
                                        ? "bg-green-100 text-green-800"
                                        : offer.status === OfferStatus.REDDEDILDI
                                        ? "bg-red-100 text-red-800"
                                        : offer.status === OfferStatus.TAMAMLANDI
                                        ? "bg-blue-100 text-blue-800"
                                        : offer.status === OfferStatus.ÜRETIMDE
                                        ? "bg-purple-100 text-purple-800"
                                        : offer.status === OfferStatus.IPTAL_EDILDI
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-orange-100 text-orange-800"
                                }`}
                            >
                                {offer.status}
                            </Badge>
                        </div>
                        {/* Müşteri Bilgisi - Belirgin */}
                        <div className="text-center mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block w-full">
                                <div className="flex items-center justify-center text-blue-700 mb-2">
                                    <User className="h-5 w-5 mr-2" />
                                    <span className="text-sm font-medium">Müşteri</span>
                                </div>
                                <p className="text-lg font-bold text-gray-900">{offer.customer_name}</p>
                            </div>
                        </div>

                        {/* Tarih Bilgileri */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                                <div className="flex justify-center text-gray-700 mb-1">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    <span className="text-sm font-medium">Teklif Tarihi</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(offer.created_at)}</p>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                                <div className="flex justify-center text-gray-700 mb-1">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span className="text-sm font-medium">Geçerlilik Tarihi</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(offer.valid_until)}</p>
                            </div>
                        </div>

                        {/* Notlar - sadece varsa göster */}
                        {offer.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-6">
                                <p className="text-sm font-medium text-gray-600 mb-1">Notlar</p>
                                <p className="text-sm text-gray-800">{offer.notes}</p>
                            </div>
                        )}

                        {/* Araç Bilgileri ve Fiyat Hesaplaması */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Sol Taraf - Araç Bilgileri */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">Araç Bilgileri</h3>

                                <div className="space-y-3 flex-grow flex flex-col justify-center">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Marka</span>
                                        <span className="font-medium">{offer.vehicle_brand}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Model</span>
                                        <span className="font-medium">{offer.vehicle_model}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Renk</span>
                                        <span className="font-medium">{offer.vehicle_color}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Motor No</span>
                                        <span className="font-medium">{offer.vehicle_engine_no}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Şasi No</span>
                                        <span className="font-medium">{offer.vehicle_chassis_no}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Plaka</span>
                                        <span className="font-medium">{offer.vehicle_plate}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sağ Taraf - Fiyat Hesaplaması */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                                    Fiyat Hesaplaması
                                </h3>

                                <div className="space-y-2 flex-grow">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Ara Toplam</span>
                                        <span className="font-medium">{formatCurrency(offer.subtotal)}</span>
                                    </div>

                                    {offer.discount_amount > 0 && (
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>
                                                İndirim
                                                {offer.discount_type === "percentage" && ` (%${offer.discount_value})`}
                                            </span>
                                            <span className="font-medium">
                                                -{formatCurrency(offer.discount_amount)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Net Tutar</span>
                                        <span className="font-medium">{formatCurrency(offer.net_total)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">KDV (%{offer.vat_rate})</span>
                                        <span className="font-medium">{formatCurrency(offer.vat_amount)}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-3">
                                    <Separator className="mb-3" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-gray-900">TOPLAM</span>
                                        <span className="text-blue-600">{formatCurrency(offer.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Karar Butonları - Sadece Taslak, Gönderildi ve Onaylandı durumlarında */}
                        {shouldShowButtons && (
                            <div className="text-center">
                                <p className="text-gray-700 mb-4 font-medium">Lütfen kararınızı verin:</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                disabled={isUpdating}
                                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-semibold transition-colors"
                                            >
                                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                Teklifi Onayla
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Teklifi onaylıyor musunuz?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bu işlem geri alınamaz. Teklifi onayladığınızda sipariş işleme
                                                    alınacaktır.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleAcceptOffer}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Evet, Onayla
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                disabled={isUpdating}
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-2 font-semibold"
                                            >
                                                <XCircleIcon className="h-4 w-4 mr-2" />
                                                Teklifi Reddet
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Teklifi reddediyor musunuz?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bu işlem geri alınamaz. Teklifi reddettiğinizde işlem
                                                    sonlandırılacaktır.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleRejectOffer}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Evet, Reddet
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OfferDetailPage;
