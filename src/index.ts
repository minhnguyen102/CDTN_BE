import express from "express"
import { routesAdmin } from "./routes/admins/index.routes"
import databaseService from "./services/database.servies"
import { defaultErrorHandler } from "./middlewares/error.middlewares"
import QRCode, { QRCodeSegment } from "qrcode"
const app = express()
const port = 3000

app.use(express.json())

// Connect database
databaseService.connect().catch(console.dir)

// Router admin
routesAdmin(app)

app.use(defaultErrorHandler)
app.get("/", (req, res) => {
  res.send("API Backend (CDTN_BE) đang chạy!")
})

const websiteURL = "https://www.facebook.com/"
app.get("/qr-link", async (req, res) => {
  try {
    // 1. Mã hóa URL thành ảnh QR (dạng Data URL)
    const qrCodeImageURL = await QRCode.toDataURL(websiteURL)
    console.log("qrCodeImageURL", qrCodeImageURL)

    // 2. Gửi ảnh QR về trình duyệt để bạn xem
    res.send(`
      <h1>Quét mã này để mở trang web</h1>
      <img src="${qrCodeImageURL}" alt="QR Code">
    `)
  } catch (err) {
    res.status(500).send("Lỗi tạo QR")
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Deploy
// export default app
