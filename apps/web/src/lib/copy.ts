import type { BodyStyle, Fuel, Gearbox } from "@/lib/domain/types";

/**
 * All user-facing text, in Serbian (Latin), informal "ti".
 *
 * The voice borrows from how people in Serbia actually write and talk about
 * selling a car: "može zamena", "ključ za ključ", "poslednja cena?". It should
 * sound like a friend who knows cars, never like a bank.
 *
 * Two rules keep it grammatical without a declension engine:
 * - car names only ever appear in the nominative ("Golf + 2.400 €"), never
 *   inside a sentence that would need a case ending or a gendered adjective;
 * - no past participles addressed to the reader, which would force a gender.
 */
export const copy = {
  meta: {
    title: "Šta tvoj auto može da postane?",
    description:
      "Menjaj auto bez oglasa i cenkanja. Reci šta voziš, pa doplati za bolji ili uzmi jeftiniji i ponesi keš. Prevuci desno šta ti se sviđa i odmah vidiš gde može zamena.",
  },

  common: {
    back: "Nazad",
    close: "Zatvori",
    done: "Gotovo",
    demoBadge: "Demo",
    demoNote: "Demo verzija: auto-kuće, vozila i cene su primeri.",
  },

  nav: {
    home: "Početna",
    deck: "Zamene",
    garage: "Garaža",
    start: "Kreni",
  },

  car: {
    add: "Dodaj svoj auto",
    yours: "Tvoj auto",
    edit: "Promeni auto",
    remove: "Ukloni moj auto",
  },

  // Which way to trade, in the words of the ads: "menjam za skuplje / za jeftinije".
  pref: {
    title: "Šta tražiš?",
    up: "Skuplji",
    upHint: "ja doplaćujem",
    down: "Jeftiniji",
    downHint: "meni keš",
    any: "Svejedno",
    anyHint: "sve što može",
    payUpTo: "Doplaćujem do",
    getAtLeast: "Dobijam bar",
    noTopUp: "Bez doplate",
    anyCash: "Koliko god",
    inPlay: "U igri",
    chipAny: (amount: string) => `Doplata do ${amount}`,
    chipUp: (amount: string) => `Skuplji · do ${amount}`,
    chipDown: (amount: string) => `Jeftiniji · bar ${amount}`,
    chipDownAny: "Jeftiniji · keš meni",
    chipNoTopUp: "Bez doplate",
    sliderPay: "Najveća doplata",
    sliderCash: "Najmanje keša",
  },

  deal: {
    price: "Cena",
    priceLower: "cena",
    evenValue: "Ključ za ključ",
    cashBackSuffix: "i još dobijaš",
    cashBackShort: (amount: string) => `dobijaš ${amount}`,
    overBudget: (amount: string) => `${amount} preko budžeta`,
    noTradeIn: "Bez zamene",
    canSwap: "Može zamena",
    addCarHint: "Dodaj auto i vidi doplatu",
  },

  deck: {
    stampLike: "MENJAM",
    stampPass: "DALJE",
    like: "Menjam",
    pass: "Dalje",
    undo: "Vrati prethodni",
    details: "Detalji",
    keys: {
      pass: "dalje",
      like: "menjam",
      details: "detalji",
      undo: "vrati",
    },
    loading: "Mešamo karte…",
    savedToast: "Parkirano u garaži",
    matchToast: "Može zamena",
    emptyTitleCar: "To je sve za tvoj izbor",
    emptyTitleNoCar: "To je sve za sada",
    emptyBodyNoCar: "Dodaj svoj auto i za svaki od njih vidiš tačnu doplatu.",
    emptyBodyNoMore: "Nova vozila stižu redovno. Navrati opet.",
    // "Ima još N" reads right for every count, so no verb has to agree with the number.
    emptyRaise: (budget: string, cars: string) => `Sa doplatom do ${budget} ima još ${cars}.`,
    raiseTo: (budget: string) => `Podigni na ${budget}`,
    emptyLessCash: (cash: string, cars: string) => `Ako pristaješ na ${cash} keša, ima još ${cars}.`,
    emptyAnyCash: (cars: string) => `Ako ti odgovara i manje keša, ima još ${cars}.`,
    lowerTo: (cash: string) => `Spusti na ${cash}`,
    anyCashWillDo: "Može i manje",
    emptyAlsoCheaper: (cars: string) => `Ima još ${cars} ako gledaš i jeftinije.`,
    emptyAlsoPricier: (cars: string) => `Ima još ${cars} ako gledaš i skuplje.`,
    alsoCheaper: "Pogledaj i jeftinije",
    alsoPricier: "Pogledaj i skuplje",
    restorePassed: "Vrati preskočene",
    openGarage: "Otvori garažu",
  },

  details: {
    swapTitle: "Zamena",
    listingPrice: "Cena automobila",
    yourCarCredit: "Tvoj auto u zamenu",
    topUp: "Doplata",
    cashBack: "Dobijaš",
    rangeNote: (low: string, high: string) =>
      `U zamenu tvoj auto vredi okvirno od ${low} do ${high}. Konačan iznos daje auto-kuća kad pogleda vozilo.`,
    notAcceptedAge: (years: number) => `Ova auto-kuća ne uzima u zamenu vozila starija od ${years} god.`,
    notAcceptedKm: (km: string) => `Ova auto-kuća ne uzima u zamenu vozila sa više od ${km}.`,
    noCar: "Dodaj svoj auto da vidiš koliko doplaćuješ.",
    specsTitle: "Podaci",
    year: "Godište",
    km: "Kilometraža",
    fuel: "Gorivo",
    gearbox: "Menjač",
    power: "Snaga",
    body: "Karoserija",
    color: "Boja",
    highlightsTitle: "Oprema i istorija",
    dealerTitle: "Auto-kuća",
    dealerTakes: (years: number, km: string) => `U zamenu uzima vozila do ${years} god. i do ${km}.`,
    photoBy: "Foto",
  },

  // What a swap costs besides the top-up. Classified ads leave this for the counter.
  costs: {
    // The heading over a total, and the one over the bare costs when there is no swap to total.
    title: "Sve ukupno",
    titleNoSwap: "Šta još plaćaš",
    transferTax: "Porez na prenos",
    transferTaxVat: (amount: string) =>
      `PDV je već u ceni, pa poreza na prenos nema. Od privatnog prodavca bi bio oko ${amount}.`,
    transferTaxPrivate: "2,5% po formuli iz zakona. Plaća ga kupac.",
    paperwork: "Papiri",
    paperworkNote: "Saobraćajna, tablice, nalepnica i overa ugovora.",
    total: "Sve ukupno",
    inHand: "Na ruke",
    totalPay: "Plaćaš ukupno",
    totalReceive: "Dobijaš na ruke",
    onTheDay: "Na dan zamene.",
    registration: "Registracija",
    registrationYear: "Godina registracije",
    perYear: "godišnje",
    registrationNote: "Porez na upotrebu, obavezno osiguranje, tehnički pregled, komunalna taksa i nalepnica.",
    about: (amount: string) => `oko ${amount}`,
    footnote: (year: string) => `Okvirno, po tarifama za ${year}. Tačne iznose dobijaš pre potpisa.`,
    // The card has room for a few words, so it borrows the shorthand of car ads.
    approx: (amount: string) => `~${amount}`,
    registrationShort: "Reg.",
    perYearShort: "/god.",
  },

  // Sending a car to someone, mostly over Viber, with the sender's own equation in the link.
  share: {
    button: "Pošalji",
    toSomeone: "Pošalji nekome",
    title: "Pošalji auto",
    viber: "Pošalji na Viber",
    whatsapp: "WhatsApp",
    copyLink: "Kopiraj link",
    copied: "Kopirano",
    more: "Još",
    includes: "U linku su samo model tvog auta i iznos. Bez imena i broja telefona.",
    includesPlain: "Šalješ samo link ka ovom autu.",
    // The words after the equation in the message, before the link.
    look: "Može zamena, pogledaj:",
    cash: "keša",
    even: "ključ za ključ",
  },

  // The page a shared link opens.
  listing: {
    sentBy: "Ko ti je poslao link, menja ovako:",
    // Third person: on this page the cash goes to the sender, not to the reader.
    senderGets: "i još dobija",
    yours: "Za tvoj auto računica je drugačija.",
    cta: "Vidi šta može za tvoj auto",
    description: (specs: string, dealer: string) =>
      `${specs}. ${dealer}. Unesi svoj auto i vidi koliko doplaćuješ ili koliko keša dobijaš.`,
    imageAlt: "Automobil i računica zamene",
  },

  wizard: {
    title: "Šta voziš?",
    searchMake: "Pretraži marke",
    popular: "Najčešće",
    otherMakes: "Ostale marke",
    noMake: "Nema takve marke na spisku.",
    pickModel: "Koji model?",
    pickYear: "Koje godište?",
    kmTitle: "Kilometraža i gorivo",
    kmLabel: "Kilometraža",
    fuelLabel: "Gorivo",
    estimate: "Da vidimo koliko vredi",
    resultLead: "vredi oko",
    resultNote:
      "Okvirna procena prema marki, modelu, godištu, kilometraži i gorivu. Tačan iznos znaš kad auto-kuća pogleda vozilo.",
    show: "Daj da vidim",
    stepOf: (step: number, total: number) => `Korak ${step} od ${total}`,
  },

  match: {
    title: "Može zamena!",
    body: (dealer: string) => `${dealer} uzima tvoj auto u zamenu.`,
    note: "Parkirano u garaži. Iznos je okviran dok auto-kuća ne pogleda vozilo.",
    keepSwiping: "Idemo dalje",
    openGarage: "Otvori garažu",
  },

  garage: {
    title: "Garaža",
    saved: (count: number) => `U garaži: ${count}`,
    emptyTitle: "Garaža zvrji prazna",
    emptyBody: "Auto koji prevučeš desno čeka te ovde, sa doplatom i auto-kućom.",
    startSwiping: "Kreni da prevlačiš",
    keepSwiping: "Nastavi da prevlačiš",
    remove: "Izbaci iz garaže",
    nextTitle: "Šta dalje?",
    nextBody: "Uskoro odavde tražiš obavezujuću ponudu auto-kuće jednim dodirom.",
  },

  landing: {
    eyebrow: (city: string) => `Zamena automobila · ${city}`,
    title: "Šta tvoj auto može da postane?",
    lead: "Reci šta voziš. Doplati za bolji ili uzmi jeftiniji pa ponesi keš. Prevuci desno šta ti se sviđa i odmah vidiš gde može zamena.",
    cta: "Kreni da prevlačiš",
    ctaCar: "Unesi svoj auto",
    equationCar: "Tvoj auto",
    equationExample: "primer",
    equationEnter: "Unesi svoj",
    equationChange: "Promeni",
    equationEmpty: "Sa ovom doplatom još nema zamene. Povuci klizač udesno.",
    equationEmptyDown: "Za toliko keša nema zamene. Povuci klizač ulevo.",
    garage: "Garaža",
    howTitle: "Kako ide zamena",
    howLead: "Četiri koraka, od tvog auta do ključa drugog.",
    steps: [
      {
        title: "Reci šta voziš",
        body: "Marka, model, godište i kilometraža. Za deset sekundi znaš koliko okvirno vredi.",
      },
      {
        title: "Skuplji ili jeftiniji?",
        body: "Za skuplji doplaćuješ, za jeftiniji dobijaš keš. Biraš jednim dodirom.",
      },
      {
        title: "Prevlači",
        body: "Desno je menjam, levo je dalje. Na svakoj kartici piše koliko sve izađe: doplata, porez, papiri i registracija.",
      },
      {
        title: "Može zamena",
        body: "Auto-kuća uzima tvoj auto u zamenu. Slede pregled, ugovor i notar, a mi te vodimo kroz svaki korak.",
      },
    ],
    howEnd: "Ključevi su tvoji.",
    // Under the cards in step three, which are real and can be swiped.
    howTry: "Probaj ovde: prevuci karticu ili dodirni dugme.",
    howPause: "Pauziraj",
    howPlay: "Pusti",
    howPhone: "Primer na telefonu",
    closingSteps: ["Pregled", "Ugovor", "Notar"],
    // Side by side with a classified ad, line for line.
    versusTitle: "Zašto ne oglas?",
    versusAd: "Preko oglasa",
    versus: [
      {
        ad: "Slikaš, pišeš oglas i javljaš se na nepoznate brojeve.",
        us: "Uneseš auto za deset sekundi. Bez oglasa.",
      },
      {
        ad: "„Koja je poslednja cena?“ u svakoj poruci.",
        us: "Doplatu ili keš vidiš na svakoj kartici. Bez cenkanja.",
      },
      {
        ad: "Porez i papire saznaš tek na šalteru.",
        us: "Porez, papire i registraciju vidiš unapred.",
      },
      {
        ad: "Čekaš da se tvoj auto proda, pa tek onda kupuješ.",
        us: "Dovezeš svoj, odvezeš drugi. Jedan dolazak.",
      },
      {
        ad: "Istoriju vozila proveravaš kako znaš i umeš.",
        us: "Istorija, zaloga i lizing proveravaju se pre potpisa.",
      },
    ],
    faqTitle: "Česta pitanja",
    faq: [
      {
        q: "Da li je procena mog auta konačna?",
        a: "Nije. To je okvirna vrednost prema marki, modelu, godištu i kilometraži. Konačan iznos daje auto-kuća kad pogleda auto.",
      },
      {
        q: "Šta ako je auto koji želim jeftiniji od mog?",
        a: "Onda razliku dobijaš ti. Na kartici piše koliko.",
      },
      {
        q: "Moram li da ostavim broj telefona?",
        a: "Za prevlačenje ne. Broj je potreban tek kad zatražiš ponudu.",
      },
      {
        q: "Koje auto-kuće učestvuju?",
        a: "Ovo je demo verzija: auto-kuće, vozila i cene su primeri. Prave ponude stižu sa prvim partnerima u Novom Sadu.",
      },
    ],
    closingTitle: "Tvoj sledeći auto je možda jedan potez daleko.",
    footerCredits: "Fotografije: Wikimedia Commons",
  },

  credits: {
    title: "Fotografije",
    lead: "Fotografije u demo verziji potiču sa Wikimedia Commons. Svaka je smanjena i sačuvana u drugom formatu; ništa drugo nije menjano.",
    author: "Autor",
    source: "Izvor",
  },

  notFound: {
    title: "Ovde nema ničega",
    body: "Stranica koju tražiš ne postoji. Automobili postoje.",
    cta: "Nazad na zamene",
  },
} as const;

export const fuelLabel: Record<Fuel, string> = {
  petrol: "Benzin",
  diesel: "Dizel",
  lpg: "Benzin + TNG",
  hybrid: "Hibrid",
  electric: "Električni",
};

export const gearboxLabel: Record<Gearbox, string> = {
  manual: "Manuelni",
  automatic: "Automatski",
};

export const bodyLabel: Record<BodyStyle, string> = {
  hatchback: "Hečbek",
  sedan: "Limuzina",
  wagon: "Karavan",
  suv: "SUV",
  mpv: "Monovolumen",
  coupe: "Kupe",
};
