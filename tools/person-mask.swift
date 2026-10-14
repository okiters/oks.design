// Person masks for every frame with Apple's Vision: swift mask.swift <frames dir> <masks dir>
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
let inDir = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])
try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
let ctx = CIContext()
let files = try FileManager.default.contentsOfDirectory(atPath: inDir.path).filter { $0.hasSuffix(".png") }.sorted()

for name in files {
    let url = inDir.appendingPathComponent(name)
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
    let request = VNGeneratePersonSegmentationRequest()
    request.qualityLevel = .accurate
    request.outputPixelFormat = kCVPixelFormatType_OneComponent8
    try VNImageRequestHandler(cgImage: image).perform([request])
    guard let buffer = request.results?.first?.pixelBuffer else { continue }
    var mask = CIImage(cvPixelBuffer: buffer)
    // scale the mask to the frame's size
    mask = mask.transformed(by: CGAffineTransform(scaleX: CGFloat(image.width) / mask.extent.width,
                                                  y: CGFloat(image.height) / mask.extent.height))
    guard let out = ctx.createCGImage(mask, from: CGRect(x: 0, y: 0, width: image.width, height: image.height)),
          let dest = CGImageDestinationCreateWithURL(outDir.appendingPathComponent(name) as CFURL,
                                                     UTType.png.identifier as CFString, 1, nil) else { continue }
    CGImageDestinationAddImage(dest, out, nil)
    CGImageDestinationFinalize(dest)
}
print("masks:", files.count)
