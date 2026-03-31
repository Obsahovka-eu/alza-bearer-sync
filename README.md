# Alza Bearer Sync

Chrome rozšíření pro automatickou synchronizaci Bearer tokenu z admin.alza.cz do Admin Exploreru.

## Instalace

1. Stáhni/klonuj tento repozitář
2. Otevři `chrome://extensions/`
3. Zapni **Developer mode** (vpravo nahoře)
4. Klikni **Load unpacked** a vyber složku tohoto repozitáře

## Aktualizace

```bash
cd alza-bearer-sync
git pull
```

Pak v `chrome://extensions/` klikni **Reload** u rozšíření.

## Funkce

- Automaticky zachytává Bearer token z požadavků na `adminapi.alza.cz`
- Injektuje token do všech tabů s Admin Explorerem
- Popup zobrazuje stav tokenu a umožňuje ho zkopírovat do schránky
- SSO flow podpora
