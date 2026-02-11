export const seller = {
  name: 'UAB „Metalo kaprizas"',
  companyCode: '605556630',
  vatCode: 'LT100013188519',
  address: 'Dvarg. g. 21, Kazokinės k., Ignalinos r. LT-30192',
  phone: '+37067883328',
  email: 'ricardas@metalokaprizas.lt',
  iban: 'LT72730001065438080',
  bank: 'AB „Swedbank"',
};

export const initialBuyer = {
  name: "",
  companyCode: "",
  vatCode: "",
  address: "",
  phone: "",
  email: "",
  deliveryAddress: "",
};

export const buyerFields = [
  { key: 'name', placeholder: 'Vardas Pavardė / Įmonė', highlight: true },
  { key: 'companyCode', placeholder: 'Įmonės kodas' },
  { key: 'vatCode', placeholder: 'PVM kodas' },
  { key: 'address', placeholder: 'Adresas' },
  { key: 'phone', placeholder: 'Tel. nr.' },
  { key: 'email', placeholder: 'El. paštas' },
  { key: 'deliveryAddress', placeholder: 'Pristatymo adresas' },
];