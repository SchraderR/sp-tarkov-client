import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<Mod[]>([
    {
      name: 'Fast healing',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1723-fast-healing/',
      image: 'https://hub.sp-tarkov.com/files/images/file/06/1723.png',
      teaser: '\n\t\t\t\t\t\tFaster healing and surgery + dynamic healing time for less damaged body parts\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Stims Galore',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1725-stims-galore/',
      icon: ' fa-flask',
      teaser: '\n\t\t\t\t\t\tEasily create your stims in-game. Tool that comes pre-packed with some new and old stims.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Skills Extended',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1722-skills-extended/',
      image: 'https://hub.sp-tarkov.com/files/images/file/00/1722.png',
      teaser: '\n\t\t\t\t\t\tExpanding the skill catalog, one skill at a time.\t\t\t\t\t',
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: '9x39mm 50-rounder 6L35',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1721-9x39mm-50-rounder-6l35/',

      icon: ' fa-bullseye',
      teaser: '\n\t\t\t\t\t\tMore boolets = more drakka\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: "MusicManiac's Advanced Quest Loader (MMAQL)",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1719-musicmaniac-s-advanced-quest-loader-mmaql/',

      icon: ' fa-check-square-o',
      teaser: '\n\t\t\t\t\t\tQuest Loader with a bunch of QOL features for end-users and modders\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'All Ammo Trader',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1720-all-ammo-trader/',
      image: 'https://hub.sp-tarkov.com/files/images/file/02/1720.jpg',

      teaser: "\n\t\t\t\t\t\tNeed all the ammo? Here's a trader\t\t\t\t\t",
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Lotus Trader',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1717-lotus-trader/',
      image: 'https://hub.sp-tarkov.com/files/images/file/4e/1717.png',

      teaser:
        '\n\t\t\t\t\t\tBusiness is business, and Tarkov has opportunities. Lotus is a trader who came to Tarkov for exactly that, and she will need your help with some things - Custom trader with 50+ quests.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Gigachad Workout',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1716-gigachad-workout/',
      image: 'https://hub.sp-tarkov.com/files/images/file/60/1716.jpg',

      teaser: '\n\t\t\t\t\t\tUseless gym? Not on my watch. Become the ripped monster you were destined to be\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Fox - PINEAPPLE BLITZ GRENADE (RE-UPLOAD)',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1714-fox-pineapple-blitz-grenade-re-upload/',
      image: 'https://hub.sp-tarkov.com/files/images/file/55/1714.png',

      teaser: '\n\t\t\t\t\t\tNade go boom.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Day Time Cultists',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1715-day-time-cultists/',
      image: 'https://hub.sp-tarkov.com/files/images/file/0d/1715.png',

      teaser: "\n\t\t\t\t\t\tFarming Cultists giving you nightmares? Can't see anything in the dark? This is a simple client mod that allows cultists to spawn during any day time raid.\t\t\t\t\t",
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Grimdark Menu Music',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1713-grimdark-menu-music/',
      image: 'https://hub.sp-tarkov.com/files/images/file/7b/1713.png',

      teaser: '\n\t\t\t\t\t\tAmbient tracks from The Midwinter Mini\'s "Death By Dice Album"\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'STALKER Music Pack',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1712-stalker-music-pack/',
      image: 'https://hub.sp-tarkov.com/files/images/file/c9/1712.jpg',

      teaser: '\n\t\t\t\t\t\tGET OUT OF HERE STALKER\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Fox - Ammo Duplicator',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1708-fox-ammo-duplicator/',
      image: 'https://hub.sp-tarkov.com/files/images/file/2b/1708.png',

      teaser: '\n\t\t\t\t\t\tDuplicate your ammo after a run to not lose anything\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Parent IDs Fixer',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1710-parent-ids-fixer/',

      icon: ' fa-file-o',
      teaser: '\n\t\t\t\t\t\tFixes stupid BSG incorrect parent IDs\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Item stash count in name',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1711-item-stash-count-in-name/',
      image: 'https://hub.sp-tarkov.com/files/images/file/f3/1711.png',

      teaser: '\n\t\t\t\t\t\tAdds a prefix to an item name that shows how many units of that item you have in your stash\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Erika',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1709-erika/',
      image: 'https://hub.sp-tarkov.com/files/images/file/37/1709.png',

      teaser: '\n\t\t\t\t\t\tVery GYATT trader who sells high end ammo  and stuff after you prove that you deserve it (do quests)\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Le Castle Vania Music Pack',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1706-le-castle-vania-music-pack/',
      image: 'https://hub.sp-tarkov.com/files/images/file/ed/1706.jpg',

      teaser: '\n\t\t\t\t\t\tGet that John Wick vibe going\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Operator Reno',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1705-operator-reno/',
      image: 'https://hub.sp-tarkov.com/files/images/file/5a/1705.jpg',

      teaser: '\n\t\t\t\t\t\tOperator Reno is a new (very light) trader made by Based Cosmo.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'AR-54 7.62x54mmR Designated Marksman Rifle (DMR)',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1704-ar-54-7-62x54mmr-designated-marksman-rifle-dmr/',
      image: 'https://hub.sp-tarkov.com/files/images/file/7c/1704.png',

      teaser: '\n\t\t\t\t\t\tAR-54 7.62x54mmR Designated Marksman Rifle\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'DJs Raid Overhaul',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1673-djs-raid-overhaul/',
      image: 'https://hub.sp-tarkov.com/files/images/file/cb/1673.png',

      teaser:
        '\n\t\t\t\t\t\tAn overhaul to how raids function including raid timer being tied to your system time with an (almost) endless raid length, random events occurring throughout your raids, and a new themed trader to help you make your way through Tarkov.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Negative Effects Chance',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1343-negative-effects-chance/',

      icon: ' fa-file-o',
      teaser: '\n\t\t\t\t\t\tAllows you to make negative effects of food and stims %-based\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Algorithmic Level Progression',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1400-algorithmic-level-progression/',
      image: 'https://hub.sp-tarkov.com/files/images/file/0b/1400.jpg',

      teaser:
        "\n\t\t\t\t\t\tPmcs level with the player, early game feels like it!\nPmcs clothing is based off of the PMC's level!\nPmcs loadouts are tiered to the four trader levels.\nPmcs will use the best gear and ammo they have with map appropriate weapons.\nRandomness galore!\t\t\t\t\t",
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'M16A4 BY Miralyn',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1357-m16a4-by-miralyn/',
      image: 'https://hub.sp-tarkov.com/files/images/file/c3/1357.png',

      teaser: '\n\t\t\t\t\t\tM16A4 BY Miralyn\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.1',
      akiVersionColorCode: 'badge label slightly-outdated',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Realism compatibility patch',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1687-realism-compatibility-patch/',
      image: 'https://hub.sp-tarkov.com/files/images/file/bc/1687.png',

      teaser: '\n\t\t\t\t\t\tCompatibility patch for some mods\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Little Addons',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1678-little-addons/',
      image: 'https://hub.sp-tarkov.com/files/images/file/8b/1678.png',

      teaser: '\n\t\t\t\t\t\tThis mod adds 3 new guns, 2 new calibers and 3 new helmets.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Andern',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1463-andern/',
      image: 'https://hub.sp-tarkov.com/files/images/file/e3/1463.jpg',

      teaser: '\n\t\t\t\t\t\tMake PMC bots dangerous again!\n\nPMC Bots use only weapon from handmade presets, best ammo and gear according to their level.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: "CactusPie's Minimap",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1120-cactuspie-s-minimap/',
      image: 'https://hub.sp-tarkov.com/files/images/file/2a/1120.png',

      teaser: '\n\t\t\t\t\t\tA Minimap software showing your current location in a spearate window - or even on a separate PC in your network\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Transfer loot into a container automatically',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1633-transfer-loot-into-a-container-automatically/',
      image: 'https://hub.sp-tarkov.com/files/images/file/20/1633.png',

      teaser: '\n\t\t\t\t\t\tLooting an item will now place it in a matching container, such as a dogtag case or a document case\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Game Panel HUD',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/652-game-panel-hud/',
      image: 'https://hub.sp-tarkov.com/files/images/file/45/652.png',

      teaser: '\n\t\t\t\t\t\tTarkov All-in-one HUD Expansion\t\t\t\t\t',
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Tactical Gear Component',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1555-tactical-gear-component/',
      image: 'https://hub.sp-tarkov.com/files/images/file/08/1555.jpg',

      teaser: '\n\t\t\t\t\t\tAdds more unique gear and attachments for Tarkov\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Vasyl the Mercenary',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1647-vasyl-the-mercenary/',
      image: 'https://hub.sp-tarkov.com/files/images/file/bc/1647.jpg',

      teaser:
        '\n\t\t\t\t\t\tThe Mercenary, a EURO Trader. Primarily buys and sells various NATO-Based weapons, parts, and equipment. Now with Loyalty Levels, and Quests! - Chapter 3 Available.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.3',
      akiVersionColorCode: 'badge label slightly-outdated',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'KMC Server Value Modifier (SVM)',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/379-kmc-server-value-modifier-svm/',
      image: 'https://hub.sp-tarkov.com/files/images/file/a8/379.jpg',

      teaser:
        '\n\t\t\t\t\t\tStandalone All-In-One Tool you ever need: Gives you the access for most game values and quality of life improvements, featuring easy-to-use GUI and ability to create presets\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.1',
      akiVersionColorCode: 'badge label slightly-outdated',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: "SAIN 2.0 - Solarint's AI Modifications - Full AI Combat System Replacement",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/',
      image: 'https://hub.sp-tarkov.com/files/images/file/c6/1062.jpg',

      teaser: "\n\t\t\t\t\t\tBots that don't suck.\t\t\t\t\t",
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: "Amands's Graphics",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/813-amands-s-graphics/',
      image: 'https://hub.sp-tarkov.com/files/images/file/f4/813.png',

      teaser: '\n\t\t\t\t\t\tLighting and postprocessing overhaul\t\t\t\t\t',
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'SPT Realism Mod',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/',
      image: 'https://hub.sp-tarkov.com/files/images/file/24/606.png',

      teaser: '\n\t\t\t\t\t\tRealistic Overhaul of SPT designed around making the game experience as realistic and hardcore as possible. Highly configurable!\t\t\t\t\t',
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'MoreCheckmarks',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1159-morecheckmarks/',
      image: 'https://hub.sp-tarkov.com/files/images/file/c5/1159.png',

      teaser: '\n\t\t\t\t\t\tA mod that adds checkmarks and more detailed tooltips to items to indicate if it is needed for hideout upgrades, quests, or if it is on your wishlist\t\t\t\t\t',
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Looting Bots',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1096-looting-bots/',

      icon: ' fa-shopping-bag',
      teaser:
        '\n\t\t\t\t\t\tThis mod aims to add more life to the bots by enhancing some EFT looting behaviors letting bots loot items, containers, and corpses during patrols. More features to come!\t\t\t\t\t',
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Waypoints - Expanded Bot Patrols and Navmesh',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1119-waypoints-expanded-bot-patrols-and-navmesh/',
      image: 'https://hub.sp-tarkov.com/files/images/file/5b/1119.png',

      teaser: '\n\t\t\t\t\t\tExpand where bots can explore with new patrols and full map navmesh coverage!\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'SWAG + Donuts - Dynamic Spawn Waves and Custom Spawn Points',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/878-swag-donuts-dynamic-spawn-waves-and-custom-spawn-points/',
      image: 'https://hub.sp-tarkov.com/files/images/file/e4/878.jpg',

      teaser:
        '\n\t\t\t\t\t\tSpawn bots anywhere - Reserve D2, Customs Crackhouse, exfils, etc. - all possible with a custom spawn point editor and dynamic spawns. Custom spawn presets, instant spawns and much more. Want total spawn unpredictability and freedom? This mod is for you.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: "Amands's Hitmarker",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/798-amands-s-hitmarker/',
      image: 'https://hub.sp-tarkov.com/files/images/file/a9/798.png',
      teaser: '\n\t\t\t\t\t\tHitmarkers with different Shapes, Colors and Sounds\t\t\t\t\t',
      supportedAkiVersion: 'Empfohlen',
      akiVersionColorCode: 'badge label green jsLabelFeatured',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'BigBrain',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1219-bigbrain/',
      icon: ' fa-file-o',
      teaser: '\n\t\t\t\t\t\tA library for adding extra logic layers to existing bot brains\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'No Bush ESP',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/903-no-bush-esp/',

      icon: ' fa-eye-slash',
      teaser: '\n\t\t\t\t\t\tTired of AI Looking at your bush and destroying you through it?  Now they no longer can.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.5',
      akiVersionColorCode: 'badge label slightly-outdated',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: "Fontaine's FOV Fix &amp; Variable Optics",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/942-fontaine-s-fov-fix-variable-optics/',
      image: 'https://hub.sp-tarkov.com/files/images/file/07/942.png',

      teaser:
        '\n\t\t\t\t\t\tMakes it so FOV does not change when ADSing by default, and allows you to instead set the FOV change yourself. Includes Variable Zoom optics and toggleable zoom (like ARMA).\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'BetterSpawnsPlus',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1002-betterspawnsplus/',
      image: 'https://hub.sp-tarkov.com/files/images/file/20/1002.png',

      teaser:
        '\n\t\t\t\t\t\tAre you tired of bots swiftly eliminating each other at the beginning of each raid, leaving the maps desolate and devoid of life? Do you find it disappointing that Labs does not offer encounters with PMCs? Fear not, for your worries end here!\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.4',
      akiVersionColorCode: 'badge label slightly-outdated',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Item Info',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/985-item-info/',

      icon: ' fa-info',
      teaser:
        '\n\t\t\t\t\t\tMassive QoL mod that shows all useful information in item descriptions (prices, barters, crafts and profit calculation, quests, hideout, armor stats, etc) and recolors all items based on MMO-like rarity with international support.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.4.0-3.6.1',
      akiVersionColorCode: 'badge label red',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Display Official Version',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1134-display-official-version/',
      image: 'https://hub.sp-tarkov.com/files/images/file/2d/1134.png',

      teaser:
        '\n\t\t\t\t\t\tThe "Display Official Version" mod fetches &amp; displays latest game version for "SPT-AKI" project in "Escape from Tarkov". Stay informed with this easy-to-install mod. Note: No new features/content, only displays official release.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Priscilu: the trader',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/546-priscilu-the-trader/',
      image: 'https://hub.sp-tarkov.com/files/images/file/54/546.jpg',

      teaser: '\n\t\t\t\t\t\tA distinguished gunsmith who smuggles some of the best weapons and equipment into Tarkov. Also he is excellent in repairing weapons and armor.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: "Fin's AI Tweaks (FAIT)",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/94-fin-s-ai-tweaks-fait/',

      icon: ' fa-file-o',
      teaser: '\n\t\t\t\t\t\tMakes the AI a little harder\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.4.0-3.6.1',
      akiVersionColorCode: 'badge label red',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
  ]);
  readonly modListSignal = this.modList.asReadonly();

  addMod(mod: Mod) {
    if (this.modList().some(m => m.name === mod.name)) {
      return;
    }

    this.modList.update(modItems => [...modItems, { ...mod, installProgress: this.initialInstallProgress() }]);
    console.log(this.modList());
  }

  updateMod() {
    this.modList.update(state => [...state]);
  }

  removeMod(name: string) {
    this.modList.update(() => [...this.modList().filter(m => m.name !== name)]);
  }

  private initialInstallProgress(): InstallProgress {
    return {
      completed: false,
      linkStep: {
        start: false,
        error: false,
        progress: 0,
      },
      downloadStep: {
        start: false,
        error: false,
        percent: 0,
        totalBytes: '',
        transferredBytes: '',
      },
      unzipStep: {
        start: false,
        error: false,
        progress: 0,
      },
    };
  }
}
