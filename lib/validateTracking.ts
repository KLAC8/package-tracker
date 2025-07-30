export function isValidTrackingNumber(trackingNumber: string): boolean {
  const trimmed = trackingNumber.trim().toUpperCase();

  return (
    /^YT\d{10,20}$/.test(trimmed) ||      // Temu, AliExpress
    /^LB\d{9}CN$/.test(trimmed) ||        // Shein
    /^LP\d{9}CN$/.test(trimmed) ||        // Alibaba
    /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(trimmed) // General format
  );
}
