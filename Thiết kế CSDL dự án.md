# THIẾT KẾ CƠ SƠ DỮ LIỆU: QUẢN LÍ QUÁN ĂN
    - Chuyển đổi từ SQL (7 bảng) -> 6 Collection (NoSQL)
    - 5 rules 
        + 1 - 1: Ưu tiên cặp key-value trong document
        + 1 - ít: Ưu tiên nhúng
        + 1 - nhiều: Ưu tiên tham chiếu (Tham chiếu phía 1)
        + 1 - rất nhiều: Ưu tiên tham chiếu (Tham chiếu phía nhiều)
        + Nhiều - Nhiều: Ưu tiên tham chiếu (Tham chiếu cả 2 bên)


## 1. accounts (admins)

- Nhân viên (Employees) liên hệ với Owner để đăng kí làm. Khi Owner tạo tài khoản mới cho nhân viên cần có các trường như `name`, `email`, `password`, `date_of_birth`, `role` là những trường bắt buộc phải có trong db bên cạnh `_id`được tự động sinh trong MongoDB

- Sau khi owner tạo tài khoản xong thì sẽ có email đính kèm (`email_verify_token`) để xác thực email. Sau khi nhân viên xác thực email thì trạng thái `email_verify_token` trong account sẽ được chuyển sang `''`, đồng thời `verify` chuyển thành Verified
    + Trong trường hợp nhân viên chưa thể verify ngay lập tức, sau có thể re-send thì sẽ tạo ra `email_verify_token` mới thay thế cho cái cũ.

- Tương tự với chức năng quên mật khẩu: Sẽ gửi mail về để reset mật khẩu, dùng `forgot_password_token`(Có chứa thông tin xác định người dùng là ai) để xác thực.

- Trường `verify` để biết trạng thái tài khoản của nhân viên (Đã xác thực, chưa xác thực, bị khóa)

- Đề xuất để UpdatedAt có giá trị ban đầu bằng với createdAt khi mới khởi tạo. Tránh lưu 2 kiểu dữ liệu khác nhau (union) để tránh xử lí logic phức tạp

```ts
enum RoleAccount {
    Employee, // tương ứng = 0
    Owner
}

enum AccountVerifyStatus{
    Unverified, // chưa xác thực (Mặc định)
    Verified, // Đã xác thực 
    Banner // Bị khóa (Đối với nhân viên được cho thôi hoặc nghỉ việc)
}

// Collection accounts
interface Account {
    "_id": ObjectId,
    "name": String,
    "email": String, // (Tạo unique index)
    "password": String, // (Lưu dạng hash)
    "date_of_birth": Date,
    "role": RoleAccount, // "Owner" hoặc "Employee"
    "avatar": String, // optional 
    "ownerId": ObjectId, // (Ref: 'accounts') - Áp dụng Quy tắc 4
    "createdAt": Date,
    "updatedAt": Date,
    "email_verify_token": string, // jwt hoặc '' nếu đã được xác thực email
    "forgot_password_token": string, // jwt hoặc '' nếu đã được xác thực
    "verify": AccountVerifyStatus, // 
}
```


## 2. dish
```ts
// collection dishs
enum DishStatus {
    Unavailable, // 0 <=> Không phục vụ
    Available, // 1 <=> Có phục vụ
}

interface Dish {
    "_id": ObjectId,
    "name": String,
    "price": Number,
    "description": String,
    "image": String,
    "status": DishStatus, 
    "createdAt": Date,
    "updatedAt": Date
}
```

## 3. dishSnapshots
```ts
// Collection: dishsnapshots
/*
    Collection này lưu lại "phiên bản" của món ăn tại thời điểm nó được cập nhật (hoặc đặt hàng).
*/
 
interface DishSnapshot {
    "_id": ObjectId,
    "dishId": ObjectId, // (Ref: 'dishes') - Áp dụng Quy tắc 4
    
    // Dữ liệu được "snapshot" (denormalized)
    "name": String,
    "price": Number,
    "description": String,
    "image": String,
    "status": String,
    
    "createdAt": Date // Thời điểm snapshot này được tạo
}
```

## 4. tables
```ts
// Collection tables

enum TableStatus {
  Available,
  Occupied
}

interface Table {
    "_id": ObjectId,
    "number": Number, // (Tạo unique index)
    "status": TableStatus, 
    "token": String, // Token cho QR code
    "imageQR": string,
    "createdAt": Date,
    "updatedAt": Date
}
```

## 5. orderSessions
```ts
// Collection orderSessions

enum OrderSessionStatus {
    Active,
    Completed,
    Cancelled
}
enum DishItemStatus {
    Pending,
    Preparing,
    Served
}

interface OrderSession {
    "_id": ObjectId,
  
    // Thông tin từ 'Guest'
    "guestName": String,
    "tableId": ObjectId, // (Ref: 'tables') - Áp dụng Quy tắc 4
    "refreshToken": String, // Token của khách để xác thực
    "refreshTokenExpiresAt": Date,
    
    // Trạng thái chung của phiên
    "status": OrderSessionStatus, 
    
    // Thông tin từ 'Order' (nhúng)
    "items": [ // Áp dụng Quy tắc 2
        {
        "_id": ObjectId, // ID của riêng item này
        "dishSnapshotId": ObjectId, // (Ref: 'dishSnapshots')
        "quantity": Number,
        "status": DishItemStatus, // "Pending", "Preparing", "Served"
        "orderHandlerId": ObjectId, // (Ref: 'accounts') - Nhân viên xử lý món này
        "createdAt": Date // Thời điểm món này được gọi
        }
    ],
    
    "createdAt": Date,
    "updatedAt": Date
}
```

## 6. RefreshToken

```ts
interface RefreshTokenType {
  _id: ObjectId
  token: string
  user_id: ObjectId
  created_at: Date
  iat: number
  exp: number
}
```

## 7. Igredients

```ts
interface Ingredient {
  _id: ObjectId,
  name: string,
  description: string,
  image: string,
  quantity: number, // auto decrease when dish status is prepared
  unit: string
}
```

### Jwt
  - Mục đích thiết kế signToken bất đồng bộ => dùng promiseAll cho RT và AT => Tối ưu performance