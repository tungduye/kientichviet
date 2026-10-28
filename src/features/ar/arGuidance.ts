export type ArNumericParameter =
  | "scale"
  | "offset_x"
  | "offset_y"
  | "offset_z"
  | "rotation_x"
  | "rotation_y"
  | "rotation_z"

export interface ArParameterGuide {
  key: ArNumericParameter
  label: string
  description: string
  example: string
}

export const AR_PARAMETER_GUIDE: ArParameterGuide[] = [
  { key: "scale", label: "Tỷ lệ mô hình", description: "Kích thước mô hình so với ảnh mục tiêu. Tăng từng 0,05 nếu mô hình quá nhỏ; giảm nếu bị tràn khung.", example: "0.4" },
  { key: "offset_x", label: "Vị trí ngang (X)", description: "Số dương dịch sang phải, số âm dịch sang trái.", example: "0.1" },
  { key: "offset_y", label: "Vị trí dọc (Y)", description: "Số dương dịch lên trên, số âm dịch xuống dưới.", example: "0.1" },
  { key: "offset_z", label: "Độ sâu (Z)", description: "Dịch mô hình theo trục sâu của ảnh mục tiêu. Nên chỉnh từng 0,05.", example: "0" },
  { key: "rotation_x", label: "Xoay trục X", description: "Nghiêng mô hình về trước hoặc sau. Giá trị dùng radian.", example: "1.57" },
  { key: "rotation_y", label: "Xoay trục Y", description: "Quay mô hình sang trái hoặc phải. Giá trị dùng radian.", example: "3.14" },
  { key: "rotation_z", label: "Xoay trục Z", description: "Xoay mô hình theo mặt phẳng ảnh mục tiêu. Giá trị dùng radian.", example: "0" },
]

export function getArParameterGuide(key: ArNumericParameter): ArParameterGuide {
  const guide = AR_PARAMETER_GUIDE.find((item) => item.key === key)
  if (!guide) throw new Error(`Unknown AR parameter: ${key}`)
  return guide
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}
