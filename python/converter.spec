# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all

# charset_normalizer uses mypyc compiled modules that PyInstaller can't detect
cn_datas, cn_binaries, cn_hiddenimports = collect_all('charset_normalizer')

a = Analysis(
    ['converter.py'],
    pathex=[],
    binaries=cn_binaries,
    datas=cn_datas,
    hiddenimports=[
        'PIL',
        'PIL.Image',
        'pythainlp',
        'pythainlp.util',
        'pythainlp.util.normalize',
        'pdfplumber',
        'pdfplumber.page',
    ] + cn_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='converter',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
