// 将 UUID 字符串转换为 BINARY(16)
function uuidToBinary(uuid) {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

// 将 BINARY(16) 转换为 UUID 字符串
function binaryToUuid(binary) {
  const hex = binary.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

module.exports = { uuidToBinary, binaryToUuid }; 