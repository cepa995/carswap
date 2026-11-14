import type { BodyStyle, Fuel, Gearbox } from "@/lib/domain/types";

/**
 * All user-facing text, in Serbian (Latin), informal "ti".
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
      "Zameni auto bez oglasa i cenkanja. Reci šta voziš i koliko možeš da doplatiš, prevuci desno ono što ti se sviđa i odmah vidiš gde može zamena.",
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
    start: "Počni",
  },

  car: {
    add: "Dodaj svoj auto",
    yours: "Tvoj auto",
    edit: "Izmeni auto",
    remove: "Ukloni moj auto",
  },

  budget: {
    chip: (amount: string) => `Doplata do ${amount}`,
    title: "Doplata",
    subtitle: "Koliko najviše možeš da dodaš uz svoj auto?",
    inBudget: "U tvom budžetu",
    evenSwap: "Ključ za ključ",
    sliderLabel: "Najveća doplata",
  },

  deal: {
    price: "Cena",
    priceLower: "cena",
    evenValue: "Ključ za ključ",
    cashBackSuffix: "i tebi ostaje",
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
    left: "Preostalo u špilu:",
    savedToast: "Sačuvano u garaži",
    matchToast: "Može zamena",
    emptyTitleCar: "To je sve u tvom budžetu",
    emptyTitleNoCar: "To je sve za sada",
    emptyBodyNoCar: "Dodaj svoj auto i za svaki od njih vidiš tačnu doplatu.",
    emptyBodyNoMore: "Novi automobili stižu redovno. Navrati opet.",
    emptyRaise: (budget: string, cars: string) => `Sa doplatom do ${budget} u igri je još ${cars}.`,
    raiseTo: (budget: string) => `Podigni na ${budget}`,
    restorePassed: "Pogledaj preskočene",
    openGarage: "Otvori garažu",
  },

  details: {
    swapTitle: "Zamena",
    listingPrice: "Cena automobila",
    yourCarCredit: "Tvoj auto u zamenu",
    topUp: "Doplata",
    cashBack: "Tebi ostaje",
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
    dealerTitle: "Prodavac",
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
    estimate: "Proceni moj auto",
    resultLead: "vredi oko",
    resultNote:
      "Okvirna procena prema marki, modelu, godištu, kilometraži i gorivu. Tačan iznos znaš kad auto-kuća pogleda vozilo.",
    budgetQuestion: "Koliko možeš da doplatiš?",
    show: "Pokaži mi",
    stepOf: (step: number, total: number) => `Korak ${step} od ${total}`,
  },

  match: {
    title: "Može zamena!",
    body: (dealer: string) => `${dealer} uzima tvoj auto u zamenu.`,
    note: "Sačuvano u garaži. Iznos je okviran dok auto-kuća ne pogleda vozilo.",
    keepSwiping: "Nastavi",
    openGarage: "Otvori garažu",
  },

  garage: {
    title: "Garaža",
    saved: (count: number) => `Sačuvano: ${count}`,
    emptyTitle: "Garaža je prazna",
    emptyBody: "Auto koji prevučeš desno čeka te ovde, zajedno sa doplatom i prodavcem.",
    startSwiping: "Počni da prevlačiš",
    keepSwiping: "Nastavi da prevlačiš",
    remove: "Ukloni iz garaže",
    nextTitle: "Šta dalje?",
    nextBody: "Uskoro odavde tražiš obavezujuću ponudu auto-kuće jednim dodirom.",
  },

  landing: {
    eyebrow: (city: string) => `Zamena automobila · ${city}`,
    title: "Šta tvoj auto može da postane?",
    lead: "Reci šta voziš i koliko možeš da doplatiš. Prevuci desno ono što ti se sviđa i odmah vidiš gde može zamena.",
    cta: "Počni da prevlačiš",
    ctaCar: "Unesi svoj auto",
    equationCar: "Tvoj auto",
    exampleNote: "Ovo je primer. Unesi svoj auto za tačan račun.",
    equationEmpty: "Sa ovom doplatom još nema zamene. Povuci klizač udesno.",
    garage: "Garaža",
    howTitle: "Kako radi",
    steps: [
      {
        title: "Reci šta voziš",
        body: "Marka, model, godište, kilometraža. Okvirnu vrednost vidiš za deset sekundi.",
      },
      {
        title: "Prevlači",
        body: "Desno je menjam, levo je dalje. Na svakoj kartici piše koliko doplaćuješ uz svoj auto.",
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
        title: "Doplata umesto cene",
        body: "Ne računaš napamet. Za svaki auto vidiš koliko dodaješ uz svoj.",
      },
      {
        title: "Jedan dolazak",
        body: "Dovezeš svoj, odvezeš drugi. Ne čekaš da se tvoj prvo proda.",
      },
      {
        title: "Provera pre potpisa",
        body: "Istorija vozila, zaloga i lizing proveravaju se pre nego što bilo šta potpišeš.",
      },
    ],
    faqTitle: "Pitanja",
    faq: [
      {
        q: "Da li je procena mog auta konačna?",
        a: "Nije. To je okvirna vrednost prema marki, modelu, godištu i kilometraži. Konačan iznos daje auto-kuća kad pogleda auto.",
      },
      {
        q: "Šta ako je auto koji želim jeftiniji od mog?",
        a: "Onda razlika ostaje tebi. Na kartici piše koliko.",
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
