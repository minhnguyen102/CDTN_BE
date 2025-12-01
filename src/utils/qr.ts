import QRCode from "qrcode"
export async function genQRtable({ qrToken }: { qrToken: string }) {
  const orderUrl = `${process.env.BASE_URL}/guest?token=${qrToken}`
  const qrCodeImageString = await QRCode.toDataURL(orderUrl, {
    errorCorrectionLevel: "H"
  })
  return qrCodeImageString
}
