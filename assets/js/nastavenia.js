/* =========================================================
   NASTAVENIA WEBU – ORL Nad jazerom
   Tento súbor môžete upravovať v bežnom textovom editore.
   Po úprave ho uložte a nahrajte na hosting do priečinka assets/js/.
   ========================================================= */

window.ORL_NASTAVENIA = {

  /* Google Tag Manager – ID kontajnera, napr. 'GTM-AB12CDE'.
     Kým je prázdne, web nič nemeria a nezobrazuje lištu so súhlasom s cookies.
     Po vyplnení sa lišta zobrazí automaticky a meranie sa spustí až po súhlase. */
  gtmId: '',

  /* Oznamy – napr. dovolenka, zastupovanie alebo zmena ordinačných hodín.
     Oznam sa zobrazí v lište navrchu každej stránky.
       od / do      – dátumy vo formáte RRRR-MM-DD (vrátane oboch dní)
       zobrazitOd   – odkedy sa má oznam ukazovať (nepovinné; inak od dátumu „od“)
       zatvorene    – true = v tieto dni web pri hodinách ukáže „Dnes neordinujeme“
       text         – text oznamu
     Príklad (odstráňte // na začiatku riadkov):  */
  oznamy: [
    // {
    //   od: '2026-12-23',
    //   do: '2027-01-02',
    //   zobrazitOd: '2026-12-09',
    //   zatvorene: true,
    //   text: 'Od 23. 12. 2026 do 2. 1. 2027 neordinujeme. Zastupuje MUDr. Meno Priezvisko, Ulica 00, Košice, tel. 055 000 00 00.'
    // },
  ]
};
