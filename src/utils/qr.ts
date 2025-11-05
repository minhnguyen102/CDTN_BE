import QRCode from "qrcode" // <-- 1. BẠN IMPORT THƯ VIỆN Ở ĐÂY
export async function genQRtable({ qrToken }: { qrToken: string }) {
  const orderUrl = `https://your-app-frontend.com/order?token=${qrToken}`
  const qrCodeImageString = await QRCode.toDataURL(orderUrl, {
    errorCorrectionLevel: "H"
  })
  return qrCodeImageString
}
