# Tải 61 sprite Pokémon (Official Artwork) từ PokeAPI vào public/images/pokemon/
# Nguồn: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{ID}.png
# Chạy:  powershell -ExecutionPolicy Bypass -File scripts/download-sprites.ps1

$ErrorActionPreference = 'Stop'

$species = @{
  # HỆ LỬA
  'Charizard' = 6;    'Blaziken' = 257;   'Arcanine' = 59;    'Infernape' = 392
  'Fuecoco' = 909;    'Flareon' = 136;    'Ninetales' = 38;    'Typhlosion' = 157
  'Cinderace' = 815;  'Houndoom' = 229;   'Charmander' = 4;    'Charmeleon' = 5
  'Crocalor' = 910;   'Skeledirge' = 911; 'Ho-Oh' = 250
  # HỆ NƯỚC
  'Greninja' = 658;   'Blastoise' = 9;    'Gyarados' = 130;    'Vaporeon' = 134
  'Mudkip' = 258;     'Kyogre' = 382;     'Milotic' = 350;     'Lapras' = 131
  'Feraligatr' = 160; 'Primarina' = 730;  'Squirtle' = 7;      'Wartortle' = 8
  'Marshtomp' = 259;  'Swampert' = 260;   'Lugia' = 249
  # HỆ ĐIỆN
  'Pikachu' = 25;     'Raichu' = 26;      'Luxray' = 405;      'Zapdos' = 145
  'Jolteon' = 135;    'Zeraora' = 807;    'Electivire' = 466;  'Manectric' = 310
  'Morpeko' = 877;    'Raikou' = 243
  # HỆ CỎ
  'Bulbasaur' = 1;    'Sceptile' = 254;   'Decidueye' = 724;   'Meowscarada' = 908
  'Celebi' = 251;     'Leafeon' = 470;    'Venusaur' = 3;      'Torterra' = 389
  'Roserade' = 407;   'Ivysaur' = 2
  # HỆ ĐÁ
  'Tyranitar' = 248;  'Onix' = 95;        'Aerodactyl' = 142;  'Lycanroc' = 745
  'Garganacl' = 934;  'Diancie' = 719;    'Rayquaza' = 384;    'Garchomp' = 445
  'Golem' = 76;       'Rhyperior' = 464;  'Aggron' = 306
}

$outDir = Join-Path $PSScriptRoot '..\public\images\pokemon'
$outDir = [System.IO.Path]::GetFullPath($outDir)
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'
$ok = 0; $fail = 0

foreach ($name in ($species.Keys | Sort-Object)) {
  $id = $species[$name]
  $dest = Join-Path $outDir "$name.png"
  $url = "$base/$id.png"

  if (Test-Path -LiteralPath $dest) {
    if ((Get-Item -LiteralPath $dest).Length -gt 0) { Write-Host "SKIP  $name ($id) - đã có"; $ok++; continue }
  }

  $success = $false
  for ($attempt = 1; $attempt -le 2; $attempt++) {
    try {
      (New-Object System.Net.WebClient).DownloadFile($url, $dest)
      if ((Get-Item -LiteralPath $dest).Length -gt 0) { $success = $true; break }
      Remove-Item -LiteralPath $dest -Force -ErrorAction SilentlyContinue
    } catch {
      Start-Sleep -Milliseconds 400
    }
  }

  if ($success) { Write-Host "OK    $name ($id)"; $ok++ }
  else { Write-Host "FAIL  $name ($id) - $url"; $fail++ }
  Start-Sleep -Milliseconds 120
}

Write-Host ""
Write-Host "Hoàn tất: $ok OK, $fail FAIL"
if ($fail -gt 0) { exit 1 }
