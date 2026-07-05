#!/usr/bin/env python3
"""يولّد خلفيات متنوعة (صور + فيديوهات) للفيديوهات القرآنية"""
import os, subprocess, math, random, json
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "backgrounds")
os.makedirs(OUT, exist_ok=True)

W, H = 1920, 1080

def lerp(a, b, t): return a + (b - a) * t
def color_lerp(c1, c2, t): return tuple(int(lerp(c1[i], c2[i], t)) for i in range(3))

def make_gradient(name, colors, vertical=True):
    """صورة تدرج لوني"""
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    steps = len(colors) - 1
    for y in range(H):
        t = y / H if vertical else 0
        seg = t * steps
        i = min(int(seg), steps - 1)
        local_t = seg - i
        c = color_lerp(colors[i], colors[i + 1], local_t)
        if vertical:
            draw.line([(0, y), (W, y)], fill=c)
        else:
            draw.line([(y, 0), (y, H)], fill=c)
    path = os.path.join(OUT, f"bg-{name}.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"  ✅ صورة: {name}.jpg")
    return path

def make_video_from_image(img_path, out_name, duration=15, zoom=False):
    """يولّد فيديو من صورة مع zoom/pan بسيط"""
    out = os.path.join(OUT, f"bg-{out_name}.mp4")
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        print(f"  ✅ فيديو موجود: {out_name}.mp4")
        return out
    scale = f"scale=1920x1080:force_original_aspect_ratio=increase,crop=1920:1080"
    if zoom:
        filt = f"{scale},zoompan=z='if(lte(on,1),1,1.02)':d={duration*fps}:s=1920x1080:fps={fps}"
    else:
        filt = scale
    cmd = [
        "ffmpeg", "-y", "-loop", "1", "-i", img_path,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-pix_fmt", "yuv420p", "-t", str(duration),
        "-vf", filt, out
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    sz = os.path.getsize(out)
    print(f"  ✅ فيديو: {out_name}.mp4 ({sz/1024/1024:.1f}MB)")
    return out

# ═══════════════════════════════════════════
# تدرجات لونية — سماوات، غروب، ليل، طبيعة
# ═══════════════════════════════════════════

gradients = {
    "سماء-زرقاء": [(135,206,235),(173,216,230),(240,248,255)],
    "سماء-عميقة": [(25,25,112),(0,0,128),(0,0,139)],
    "سماء-غروب": [(255,69,0),(255,140,0),(255,215,0)],
    "سماء-غروب-وردي": [(255,105,180),(255,20,147),(139,0,139)],
    "سماء-ليل-نجوم": [(5,5,30),(10,10,50),(15,15,70)],
    "سماء-فجر": [(255,182,193),(255,228,196),(255,255,255)],
    "سحاب-رمادي": [(169,169,169),(192,192,192),(211,211,211)],
    "سحاب-ضباب": [(176,196,222),(188,210,238),(205,220,240)],
    "فضاء-عميق": [(0,0,0),(8,8,50),(15,15,80)],
    "فضاء-بنفسجي": [(20,0,40),(40,0,60),(60,10,80)],
    "صحراء-ذهبية": [(210,180,140),(238,203,173),(245,222,179)],
    "صحراء-غروب": [(178,85,25),(205,133,63),(222,184,135)],
    "بحر-فيروزي": [(0,150,136),(0,200,180),(64,224,208)],
    "بحر-عميق": [(0,0,100),(0,0,139),(25,25,150)],
    "طبيعة-خضراء": [(34,139,34),(0,150,0),(144,238,144)],
    "طبيعة-غابة": [(1,50,32),(34,80,50),(70,130,80)],
    "ليل-أخضر-مسجد": [(10,40,20),(15,60,30),(20,80,40)],
    "ذهبي-مسجد": [(80,60,20),(120,90,30),(160,130,50)],
    "أزرق-مسجد": [(15,30,60),(20,45,80),(30,60,100)],
    "أرجواني-روحاني": [(48,25,52),(73,38,82),(98,50,112)],
    "ثلوج-بيضاء": [(240,248,255),(230,240,250),(220,230,245)],
    "غروب-أحمر": [(139,0,0),(178,34,34),(220,20,60)],
    "أمواج-زرقاء": [(0,105,148),(0,130,170),(0,160,200)],
    "قمر-ليلي": [(25,25,50),(40,40,70),(60,60,100)],
    "أزهار-ربيع": [(255,182,193),(255,218,185),(255,240,245)],
}

random.seed(42)
for name, colors in gradients.items():
    p = make_gradient(name, colors)

# ═══════════════════════════════════════════
# توليد فيديوهات من الصور (مع zoom بسيط)
# ═══════════════════════════════════════════

fps = 30
video_sources = [
    "سماء-زرقاء", "سماء-عميقة", "سماء-غروب", "سماء-ليل-نجوم",
    "سماء-فجر", "فضاء-عميق", "صحراء-ذهبية", "بحر-فيروزي",
    "طبيعة-خضراء", "ليل-أخضر-مسجد", "ذهبي-مسجد", "أزرق-مسجد",
    "أرجواني-روحاني", "غروب-أحمر", "سماء-غروب-وردي", "فضاء-بنفسجي",
    "بحر-عميق", "قمر-ليلي", "أمواج-زرقاء", "سحاب-رمادي",
]

print("\n📹 توليد فيديوهات قصيرة من الصور...")
for src in video_sources:
    img_path = os.path.join(OUT, f"bg-{src}.jpg")
    if os.path.exists(img_path):
        make_video_from_image(img_path, src, duration=15, zoom=True)

print(f"\n✅ تم توليد {len(gradients)} خلفية و {len(video_sources)} فيديو")
