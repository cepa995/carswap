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
      "Menjaj auto bez oglasa i cenkanja. Reci šta voziš i koliko možeš da doplatiš, prevuci desno šta ti se sviđa i odmah vidiš gde može zamena.",
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

  budget: {
    chip: (amount: string) => `Doplata do ${amount}`,
    title: "Doplata",
    subtitle: "Koliko najviše dodaješ uz svoj auto?",
    inBudget: "U tvom budžetu",
    evenSwap: "Ključ za ključ",
    sliderLabel: "Najveća doplata",
  },

  deal: {
    price: "Cena",
    priceLower: "cena",
    evenValue: "Ključ za ključ",
    cashBackSuffix: "i još dobijaš",
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
    emptyTitleCar: "To je sve u tvom budžetu",
    emptyTitleNoCar: "To je sve za sada",
    emptyBodyNoCar: "Dodaj svoj auto i za svaki od njih vidiš tačnu doplatu.",
    emptyBodyNoMore: "Nova vozila stižu redovno. Navrati opet.",
    emptyRaise: (budget: string, cars: string) => `Sa doplatom do ${budget} u igri je još ${cars}.`,
    raiseTo: (budget: string) => `Podigni na ${budget}`,
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
    budgetQuestion: "Koliko možeš da doplatiš?",
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
    lead: "Reci šta voziš i koliko možeš da doplatiš. Prevuci desno šta ti se sviđa i odmah vidiš gde može zamena. Bez oglasa i bez „koja je poslednja cena?“.",
    cta: "Kreni da prevlačiš",
    ctaCar: "Unesi svoj auto",
    equationCar: "Tvoj auto",
    equationExample: "primer",
    equationEnter: "Unesi svoj",
    equationChange: "Promeni",
    equationTopUp: "Doplata",
    equationEmpty: "Sa ovom doplatom još nema zamene. Povuci klizač udesno.",
    garage: "Garaža",
    howTitle: "Kako ide zamena",
    steps: [
      {
        title: "Reci šta voziš",
        body: "Marka, model, godište, kilometraža. Za deset sekundi znaš koliko okvirno vredi.",
      },
      {
        title: "Prevlači",
        body: "Desno je menjam, levo je dalje. Na svakoj kartici piše koliko doplaćuješ.",
      },
      {
        title: "Može zamena",
        body: "Auto-kuća uzima tvoj auto u zamenu. Slede pregled, ugovor i notar, a mi te vodimo kroz svaki korak.",
      },
    ],
    closingSteps: ["Pregled", "Ugovor", "Notar"],
    whyTitle: "Zašto ne oglas?",
    why: [
      {
        title: "Bez oglasa",
        body: "Ne slikaš, ne pišeš oglas i ne javljaš se na nepoznate brojeve.",
      },
      {
        title: "Bez „poslednja cena?“",
        body: "Doplatu vidiš unapred, na svakoj kartici. Nema cenkanja u porukama.",
      },
      {
        title: "Jedan dolazak",
        body: "Dovezeš svoj, odvezeš drugi. Ne čekaš da se tvoj prvo proda.",
      },
      {
        title: "Provereno pre potpisa",
        body: "Istorija vozila, zaloga i lizing proveravaju se pre nego što bilo šta potpišeš.",
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
