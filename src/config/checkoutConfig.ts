export const seller = {
  name: 'UAB „Metalo kaprizas"',
  companyCode: '605556630',
  vatCode: 'LT100013188519',
  address: 'Dvaro. g. 21, Kazokinės k., Ignalinos r. LT-30192',
  phone: '+37067883328',
  email: 'ricardas@metalokaprizas.lt',
  iban: 'LT72730001065438080',
  bank: 'AB „Swedbank"',
};

export const initialBuyer = {
  name: '',
  email: '',
  phone: '',
  address: '',
  companyCode: '',
  vatCode: '',
};

export const buyerFields: Array<{
  key: keyof typeof initialBuyer;
  placeholder: string;
  type: string;
  required: boolean;
}> = [
  { key: 'name',  placeholder: 'Vardas Pavardė',  type: 'text',  required: true },
  { key: 'email', placeholder: 'El. paštas',       type: 'email', required: true },
  { key: 'phone', placeholder: 'Tel. nr.',          type: 'tel',   required: true },
  { key: 'address', placeholder: 'Adresas',         type: 'text',  required: true },
];