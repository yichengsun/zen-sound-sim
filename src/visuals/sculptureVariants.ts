import type { SculptureId } from '../events';

/**
 * Each plinth position can wear more than one sculpture design. `markup`
 * is the inner content of that position's `<g data-sculpture>` — a visual
 * layer (pointer-events:none) and a zone layer (data-zone hit shapes) —
 * so swapping a variant is just an innerHTML replace on the same group;
 * everything else (anchor, breathing, gesture zones) keeps working
 * unchanged because it all queries the live DOM.
 *
 * "classic" is the original design for that position. The rest are new
 * forms adapted from the artist's reference photos, simplified into the
 * same flat, non-photorealistic line language.
 */
export interface SculptureVariant {
  id: string;
  label: string;
  markup: string;
}

export const VARIANT_DEFS: Record<SculptureId | 'garden', SculptureVariant[]> = {
  garden: [],

  trickster: [
    {
      id: 'classic',
      label: 'classic',
      markup: `
        <g pointer-events="none">
          <ellipse cx="490" cy="384" rx="9" ry="10" fill="#332e29"/>
          <ellipse cx="490" cy="398" rx="27" ry="13" fill="url(#rust)"/>
          <rect x="442" y="400" width="96" height="70" rx="17" fill="url(#charcoal)"/>
          <line x1="448" y1="418" x2="532" y2="418" stroke="#57504a" stroke-width="1.6" opacity="0.7"/>
          <line x1="446" y1="452" x2="534" y2="452" stroke="#28231f" stroke-width="1.6" opacity="0.8"/>
          <circle cx="470" cy="433" r="7.5" fill="#17130f"/>
          <circle cx="510" cy="433" r="7.5" fill="#17130f"/>
          <rect x="418" y="468" width="144" height="30" rx="14" fill="url(#rust)"/>
          <rect x="428" y="495" width="124" height="72" rx="12" fill="url(#charcoal)"/>
          <path d="M 452 567 a 11 14 0 0 1 22 0 Z" fill="#a3543e"/>
          <path d="M 479 567 a 11 14 0 0 1 22 0 Z" fill="#a3543e"/>
          <path d="M 506 567 a 11 14 0 0 1 22 0 Z" fill="#a3543e"/>
          <line x1="434" y1="512" x2="546" y2="512" stroke="#57504a" stroke-width="1.4" opacity="0.6"/>
        </g>
        <g fill="transparent">
          <rect x="414" y="380" width="152" height="190" data-zone="body"/>
          <ellipse cx="490" cy="528" rx="64" ry="40" data-zone="belly"/>
          <ellipse cx="490" cy="412" rx="56" ry="34" data-zone="head"/>
          <ellipse cx="490" cy="436" rx="34" ry="20" data-zone="face"/>
        </g>`,
    },
    {
      id: 'totemkin',
      label: 'totem kin',
      markup: `
        <g pointer-events="none">
          <circle cx="490" cy="522" r="52" fill="url(#kinTeal)"/>
          <path d="M 440 505 q 20 40 5 55 M 540 505 q -20 40 -5 55" stroke="#26332e" stroke-width="1.6" opacity="0.3" fill="none"/>
          <circle cx="474" cy="516" r="3.5" fill="#131a17"/>
          <circle cx="506" cy="516" r="3.5" fill="#131a17"/>
          <path d="M 490 522 l -3 12 q 3 4 6 0 Z" fill="#26332e" opacity="0.6"/>
          <line x1="478" y1="534" x2="502" y2="534" stroke="#131a17" stroke-width="2" opacity="0.7"/>
          <circle cx="490" cy="452" r="40" fill="url(#kinOrangeMid)"/>
          <circle cx="450" cy="452" r="9" fill="#9c4726"/>
          <circle cx="530" cy="452" r="9" fill="#9c4726"/>
          <circle cx="460" cy="455" r="6" fill="none" stroke="#c96b3f" stroke-width="1.4" opacity="0.5"/>
          <circle cx="520" cy="455" r="6" fill="none" stroke="#c96b3f" stroke-width="1.4" opacity="0.5"/>
          <circle cx="478" cy="448" r="3" fill="#1e120a"/>
          <circle cx="502" cy="448" r="3" fill="#1e120a"/>
          <path d="M 490 448 l -2 10 q 2 3 4 0 Z" fill="#7a3a1e" opacity="0.6"/>
          <line x1="480" y1="464" x2="500" y2="464" stroke="#1e120a" stroke-width="1.8"/>
          <circle cx="490" cy="398" r="28" fill="url(#kinOrangeTop)"/>
          <path d="M 470 378 L 462 358 L 480 372 Z" fill="url(#kinOrangeTop)"/>
          <path d="M 510 378 L 518 358 L 500 372 Z" fill="url(#kinOrangeTop)"/>
          <circle cx="482" cy="394" r="2.2" fill="#1e120a"/>
          <circle cx="498" cy="394" r="2.2" fill="#1e120a"/>
          <path d="M 482 405 Q 490 411 498 405" stroke="#1e120a" stroke-width="2" fill="none" stroke-linecap="round"/>
        </g>
        <g fill="transparent">
          <rect x="430" y="355" width="120" height="225" data-zone="body"/>
          <circle cx="490" cy="522" r="52" data-zone="belly"/>
          <circle cx="490" cy="398" r="32" data-zone="head"/>
          <circle cx="490" cy="452" r="42" data-zone="face"/>
          <circle cx="450" cy="452" r="15" data-zone="ear"/>
          <circle cx="530" cy="452" r="15" data-zone="ear"/>
        </g>`,
    },
    {
      id: 'twinhorns',
      label: 'twin horns',
      markup: `
        <g pointer-events="none">
          <path d="M 430 568 C 425 540 445 515 490 513 C 535 515 555 540 550 568 Z" fill="url(#hornBase)"/>
          <path d="M 448 535 q 42 14 84 0 M 452 552 q 38 10 76 0" stroke="#3f464b" stroke-width="1.6" opacity="0.35" fill="none"/>
          <path d="M 472 515 C 455 490 440 455 442 415 C 445 400 465 395 472 405 C 478 430 478 470 485 510 Z" fill="url(#hornSkin)"/>
          <path d="M 508 515 C 525 490 540 455 538 415 C 535 400 515 395 508 405 C 502 430 502 470 495 510 Z" fill="url(#hornSkin)"/>
          <path d="M 478 510 Q 490 500 502 510" stroke="#3f464b" stroke-width="2" fill="none" opacity="0.6"/>
          <path d="M 448 408 q 8 -6 16 0" stroke="#2c3236" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <path d="M 524 408 q 8 -6 16 0" stroke="#2c3236" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <circle cx="438" cy="420" r="7" fill="#5c646b"/>
          <circle cx="542" cy="420" r="7" fill="#5c646b"/>
        </g>
        <g fill="transparent">
          <rect x="420" y="395" width="140" height="175" data-zone="body"/>
          <ellipse cx="490" cy="545" rx="60" ry="28" data-zone="belly"/>
          <ellipse cx="490" cy="465" rx="35" ry="55" data-zone="head"/>
          <circle cx="456" cy="415" r="20" data-zone="ear"/>
          <circle cx="524" cy="415" r="20" data-zone="ear"/>
        </g>`,
    },
  ],

  guardian: [
    {
      id: 'classic',
      label: 'classic',
      markup: `
        <g pointer-events="none">
          <path d="M 805 240
                   C 758 240 734 276 730 320
                   C 726 352 714 372 699 396
                   C 678 431 689 468 730 470
                   L 880 470
                   C 921 468 932 431 911 396
                   C 896 372 884 352 880 320
                   C 876 276 852 240 805 240 Z" fill="url(#guardianSkin)"/>
          <g stroke="#4a3627" stroke-width="2" fill="none" opacity="0.35">
            <path d="M 805 242 v 224"/>
            <path d="M 776 246 q -10 108 -32 216"/>
            <path d="M 834 246 q 10 108 32 216"/>
            <path d="M 752 258 q -14 96 -42 196"/>
            <path d="M 858 258 q 14 96 42 196"/>
          </g>
          <rect x="700" y="352" width="24" height="42" rx="12" fill="#96734f"/>
          <rect x="886" y="352" width="24" height="42" rx="12" fill="#96734f"/>
          <path d="M 752 352 q 12 12 26 8" stroke="#2b2018" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          <path d="M 858 352 q -12 12 -26 8" stroke="#2b2018" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          <path d="M 793 356 q 12 -8 24 0 l -4 36 q -8 6 -16 0 Z" fill="#6b4d34"/>
          <circle cx="799" cy="390" r="2" fill="#3d2c1e"/>
          <circle cx="811" cy="390" r="2" fill="#3d2c1e"/>
          <path d="M 788 422 q 17 10 34 0" stroke="#4a3627" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7"/>
        </g>
        <g fill="transparent">
          <path d="M 805 240 C 758 240 734 276 730 320 C 726 352 714 372 699 396 C 678 431 689 468 730 470 L 880 470 C 921 468 932 431 911 396 C 896 372 884 352 880 320 C 876 276 852 240 805 240 Z" data-zone="body"/>
          <ellipse cx="805" cy="442" rx="86" ry="34" data-zone="belly"/>
          <ellipse cx="805" cy="278" rx="60" ry="42" data-zone="head"/>
          <ellipse cx="805" cy="382" rx="58" ry="48" data-zone="face"/>
          <circle cx="710" cy="372" r="30" data-zone="ear"/>
          <circle cx="900" cy="372" r="30" data-zone="ear"/>
        </g>`,
    },
    {
      id: 'woven',
      label: 'woven elder',
      markup: `
        <g pointer-events="none">
          <path d="M 710 470 C 700 420 730 372 805 370 C 880 372 910 420 900 470 Z" fill="url(#wovenBody)"/>
          <g stroke="#8a7357" stroke-width="1.4" opacity="0.3">
            <path d="M 725 400 l 160 60" fill="none"/>
            <path d="M 735 430 l 150 35" fill="none"/>
            <path d="M 760 385 l 100 78" fill="none"/>
            <path d="M 860 390 l -95 72" fill="none"/>
          </g>
          <path d="M 775 372 L 772 300 Q 773 250 805 248 Q 837 250 838 300 L 835 372 Z" fill="url(#wovenNeck)"/>
          <ellipse cx="762" cy="325" rx="13" ry="20" fill="#c9a876"/>
          <ellipse cx="848" cy="325" rx="13" ry="20" fill="#c9a876"/>
          <path d="M 775 300 q 12 -8 24 0" stroke="#1c140c" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M 806 300 q 12 -8 24 0" stroke="#1c140c" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M 805 285 L 800 315 Q 805 320 810 315 Z" fill="#c9a876"/>
          <ellipse cx="805" cy="330" rx="3" ry="2" fill="#1c140c"/>
        </g>
        <g fill="transparent">
          <rect x="705" y="250" width="200" height="220" data-zone="body"/>
          <ellipse cx="805" cy="430" rx="95" ry="45" data-zone="belly"/>
          <ellipse cx="805" cy="262" rx="45" ry="34" data-zone="head"/>
          <ellipse cx="805" cy="312" rx="42" ry="50" data-zone="face"/>
          <ellipse cx="762" cy="325" rx="20" ry="28" data-zone="ear"/>
          <ellipse cx="848" cy="325" rx="20" ry="28" data-zone="ear"/>
        </g>`,
    },
    {
      id: 'bell',
      label: 'bell elder',
      markup: `
        <g pointer-events="none">
          <ellipse cx="805" cy="320" rx="115" ry="80" fill="url(#bellDome)"/>
          <g stroke="#3a2a1a" stroke-width="1.4" opacity="0.22">
            <path d="M 805 250 L 730 370" fill="none"/>
            <path d="M 805 250 L 880 370" fill="none"/>
            <path d="M 805 245 L 805 375" fill="none"/>
            <path d="M 805 250 L 760 380" fill="none"/>
            <path d="M 805 250 L 850 380" fill="none"/>
          </g>
          <path d="M 740 388 C 730 415 745 445 770 470 L 840 470 C 865 445 880 415 870 388 Z" fill="url(#bellBase)"/>
          <circle cx="700" cy="345" r="11" fill="#7a5a3e"/>
          <circle cx="910" cy="345" r="11" fill="#7a5a3e"/>
          <path d="M 805 300 L 800 335 Q 805 340 810 335 Z" fill="#c98a5e"/>
          <circle cx="785" cy="312" r="4" fill="#241a12"/>
          <circle cx="825" cy="312" r="4" fill="#241a12"/>
          <ellipse cx="805" cy="345" rx="8" ry="4" fill="#241a12"/>
        </g>
        <g fill="transparent">
          <rect x="690" y="248" width="230" height="222" data-zone="body"/>
          <ellipse cx="805" cy="432" rx="65" ry="42" data-zone="belly"/>
          <ellipse cx="805" cy="285" rx="70" ry="45" data-zone="head"/>
          <ellipse cx="805" cy="320" rx="60" ry="55" data-zone="face"/>
          <circle cx="700" cy="345" r="20" data-zone="ear"/>
          <circle cx="910" cy="345" r="20" data-zone="ear"/>
        </g>`,
    },
  ],

  vessel: [
    {
      id: 'classic',
      label: 'classic',
      markup: `
        <g pointer-events="none">
          <circle cx="1105" cy="480" r="68" fill="url(#vesselBelly)"/>
          <rect x="1078" y="340" width="54" height="122" rx="26" fill="url(#vesselNeck)"/>
          <path d="M 1082 350 q 23 14 46 0 l 0 34 q -10 10 -23 10 q -13 0 -23 -10 Z" fill="#4f5f54" opacity="0.45"/>
          <ellipse cx="1105" cy="342" rx="27" ry="9" fill="#46554b"/>
          <ellipse cx="1105" cy="342" rx="18" ry="5" fill="#333f37"/>
          <circle cx="1070" cy="382" r="11" fill="#6d7c6b"/>
          <circle cx="1140" cy="382" r="11" fill="#6d7c6b"/>
          <path d="M 1090 386 q 6 5 12 0" stroke="#2c3831" stroke-width="3" stroke-linecap="round" fill="none"/>
          <path d="M 1108 386 q 6 5 12 0" stroke="#2c3831" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="1105" cy="404" r="3" fill="#2c3831"/>
          <path d="M 1085 474 q 6 6 13 0" stroke="#8d8168" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M 1112 474 q 6 6 13 0" stroke="#8d8168" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M 1096 495 q 9 7 18 0" stroke="#8d8168" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
          <path d="M 1058 448 q -10 22 -6 44" stroke="#c6bb9e" stroke-width="3" fill="none" opacity="0.5"/>
        </g>
        <g fill="transparent">
          <rect x="1074" y="336" width="62" height="130" data-zone="body"/>
          <circle cx="1105" cy="480" r="66" data-zone="belly"/>
          <ellipse cx="1105" cy="344" rx="30" ry="15" data-zone="head"/>
          <ellipse cx="1105" cy="394" rx="27" ry="32" data-zone="face"/>
          <circle cx="1068" cy="382" r="20" data-zone="ear"/>
          <circle cx="1142" cy="382" r="20" data-zone="ear"/>
        </g>`,
    },
    {
      id: 'twine',
      label: 'corded jar',
      markup: `
        <g pointer-events="none">
          <circle cx="1105" cy="483" r="64" fill="url(#twineBelly)"/>
          <path d="M 1050 460 q 55 22 110 0 M 1055 495 q 50 18 100 0" stroke="#8a7550" stroke-width="1.4" opacity="0.25" fill="none"/>
          <path d="M 1082 452 C 1080 420 1084 398 1105 396 C 1126 398 1130 420 1128 452 Z" fill="url(#twineNeck)"/>
          <ellipse cx="1105" cy="397" rx="23" ry="7" fill="#8a7550"/>
          <circle cx="1063" cy="458" r="10" fill="#cdb98c"/>
          <circle cx="1147" cy="458" r="10" fill="#cdb98c"/>
          <path d="M 1075 452 Q 1105 468 1135 452" stroke="#d9c7a0" stroke-width="2.4" fill="none" opacity="0.85"/>
          <path d="M 1135 452 q 20 10 30 28" stroke="#d9c7a0" stroke-width="1.6" fill="none" opacity="0.7"/>
          <path d="M 1105 418 L 1101 440 Q 1105 444 1109 440 Z" fill="#cdb98c" opacity="0.9"/>
          <circle cx="1094" cy="422" r="3.5" fill="#3a2e1e"/>
          <circle cx="1116" cy="422" r="3.5" fill="#3a2e1e"/>
          <ellipse cx="1105" cy="438" rx="7" ry="4" fill="#241c12"/>
        </g>
        <g fill="transparent">
          <rect x="1074" y="396" width="62" height="160" data-zone="body"/>
          <circle cx="1105" cy="483" r="64" data-zone="belly"/>
          <ellipse cx="1105" cy="402" rx="26" ry="14" data-zone="head"/>
          <ellipse cx="1105" cy="428" rx="24" ry="26" data-zone="face"/>
          <circle cx="1063" cy="458" r="16" data-zone="ear"/>
          <circle cx="1147" cy="458" r="16" data-zone="ear"/>
        </g>`,
    },
    {
      id: 'bottle',
      label: 'twin-faced bottle',
      markup: `
        <g pointer-events="none">
          <path d="M 1085 455 C 1082 420 1083 375 1090 352 C 1095 348 1115 348 1120 352 C 1127 375 1128 420 1125 455 Z" fill="url(#bottleDark)"/>
          <ellipse cx="1105" cy="352" rx="20" ry="6" fill="#2c3833"/>
          <circle cx="1105" cy="500" r="58" fill="url(#bottlePale)"/>
          <ellipse cx="1082" cy="554" rx="8" ry="5" fill="#c4bca8"/>
          <ellipse cx="1128" cy="554" rx="8" ry="5" fill="#c4bca8"/>
          <path d="M 1083 410 q -10 4 -8 16 q 2 8 10 4 Z" fill="#2c3833"/>
          <path d="M 1127 410 q 10 4 8 16 q -2 8 -10 4 Z" fill="#2c3833"/>
          <path d="M 1105 395 q -3 10 0 18 q 3 -8 0 -18" stroke="#8fa39a" stroke-width="1.6" fill="none" opacity="0.6"/>
          <path d="M 1093 400 q 6 -4 10 0 q -4 3 -10 0" fill="#1a211d"/>
          <path d="M 1107 400 q 6 -4 10 0 q -4 3 -10 0" fill="#1a211d"/>
          <circle cx="1105" cy="418" r="2.5" fill="#1a211d"/>
          <circle cx="1090" cy="490" r="2.5" fill="#8f8570"/>
          <circle cx="1120" cy="490" r="2.5" fill="#8f8570"/>
          <path d="M 1097 508 L 1113 508" stroke="#8f8570" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g fill="transparent">
          <rect x="1078" y="350" width="54" height="210" data-zone="body"/>
          <circle cx="1105" cy="500" r="58" data-zone="belly"/>
          <ellipse cx="1105" cy="358" rx="22" ry="10" data-zone="head"/>
          <ellipse cx="1105" cy="398" rx="20" ry="30" data-zone="face"/>
          <circle cx="1087" cy="414" r="14" data-zone="ear"/>
          <circle cx="1123" cy="414" r="14" data-zone="ear"/>
        </g>`,
    },
  ],
};
