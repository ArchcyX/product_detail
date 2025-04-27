#!/usr/bin/env python3
import json
import base64
import urllib.parse
import argparse
import sys

def base64_to_utf8(b64_str: str) -> str:
    """
    JS utf8ToBase64’in tersi:
      1) Base64 → bytes
      2) her byte’ı %xx formuna çevir
      3) urllib.parse.unquote ile percent-decode → doğru UTF-8 string
    """
    raw = base64.b64decode(b64_str)
    percent_encoded = ''.join(f'%{b:02x}' for b in raw)
    return urllib.parse.unquote(percent_encoded)

def xor_decrypt(text: str, key: str) -> str:
    """
    Basit XOR decrypt; JS encryptXOR’in tersi.
    text içindeki her karakteri key’in ilgili karakteriyle XOR’la.
    """
    return ''.join(
        chr(ord(text[i]) ^ ord(key[i % len(key)]))
        for i in range(len(text))
    )

def main():
    parser = argparse.ArgumentParser(
        description="Decrypt form JSON (Base64 + XOR şifrelemesini çözer)"
    )
    parser.add_argument("input", help="Şifreli JSON dosyası (örn. encrypted.json)")
    parser.add_argument(
        "-o", "--output",
        help="Çözülmüş JSON’u kaydedeceği dosya (isteğe bağlı)",
        default=None
    )
    args = parser.parse_args()

    # 1) JSON’u oku
    try:
        with open(args.input, encoding="utf-8") as f:
            obj = json.load(f)
    except Exception as e:
        print("Dosya okunamadı:", e, file=sys.stderr)
        sys.exit(1)

    # 2) Alanları al
    encrypted_b64 = obj.get("data")
    key             = obj.get("key")
    if encrypted_b64 is None or key is None:
        print("JSON içinde 'data' veya 'key' bulunamadı.", file=sys.stderr)
        sys.exit(1)

    # 3) Base64 → şifreli metin
    encrypted_text = base64_to_utf8(encrypted_b64)

    # 4) XOR çöz
    decrypted_str = xor_decrypt(encrypted_text, key)

    # 5) Ortaya çıkanın JSON olup olmadığını kontrol et, parse et
    try:
        decrypted_obj = json.loads(decrypted_str)
    except json.JSONDecodeError:
        print("Çözülen metin geçerli JSON değil, ham çıktıyı gösteriyorum:\n")
        print(decrypted_str)
        sys.exit(1)

    # 6) Çıktıyı yazdır veya dosyaya kaydet
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(decrypted_obj, f, ensure_ascii=False, indent=2)
        print("Çözülmüş JSON kaydedildi:", args.output)
    else:
        print(json.dumps(decrypted_obj, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
