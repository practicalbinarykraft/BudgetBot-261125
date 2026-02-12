/**
 * Test: voice-parse mimeType extension mapping.
 *
 * The server maps mimeType to file extension for the temp file.
 * "audio/mp4" must map to "m4a" (iOS AAC recording format).
 * "audio/m4a" must also map to "m4a" (legacy/alternative MIME type).
 */

function getExtensionForMimeType(mimeType: string): string {
  let extension = "wav"; // fallback
  if (mimeType.includes("mp4") || mimeType.includes("m4a") || mimeType.includes("aac")) {
    extension = "m4a";
  } else if (mimeType.includes("webm")) {
    extension = "webm";
  } else if (mimeType.includes("ogg")) {
    extension = "ogg";
  } else if (mimeType.includes("mp3")) {
    extension = "mp3";
  } else if (mimeType.includes("wav")) {
    extension = "wav";
  }
  return extension;
}

describe("voice mimeType to extension mapping", () => {
  it("maps audio/mp4 to m4a (iOS standard)", () => {
    expect(getExtensionForMimeType("audio/mp4")).toBe("m4a");
  });

  it("maps audio/m4a to m4a (alternative MIME)", () => {
    expect(getExtensionForMimeType("audio/m4a")).toBe("m4a");
  });

  it("maps audio/aac to m4a", () => {
    expect(getExtensionForMimeType("audio/aac")).toBe("m4a");
  });

  it("maps audio/webm to webm", () => {
    expect(getExtensionForMimeType("audio/webm")).toBe("webm");
  });

  it("maps audio/wav to wav", () => {
    expect(getExtensionForMimeType("audio/wav")).toBe("wav");
  });

  it("falls back to wav for unknown types", () => {
    expect(getExtensionForMimeType("audio/unknown")).toBe("wav");
  });

  it("mobile sends audio/mp4 which correctly resolves", () => {
    // This is the value the mobile client now sends
    const mobileMimeType = "audio/mp4";
    expect(getExtensionForMimeType(mobileMimeType)).toBe("m4a");
  });
});
