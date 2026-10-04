/**
 * Where the person lives, for the civics answers that depend on it: the state capital, and whether
 * the place has U.S. senators, a governor and a voting representative. Names of senators, the
 * governor and the representative change with elections, so Camino links the official lookups
 * instead and lets the person write them down (see current.ts).
 */

export interface Place {
  code: string;
  name: string;
  capital: string;
  kind: 'state' | 'dc' | 'territory';
}

export const PLACES: Place[] = [
  { code: 'AL', name: 'Alabama', capital: 'Montgomery', kind: 'state' },
  { code: 'AK', name: 'Alaska', capital: 'Juneau', kind: 'state' },
  { code: 'AZ', name: 'Arizona', capital: 'Phoenix', kind: 'state' },
  { code: 'AR', name: 'Arkansas', capital: 'Little Rock', kind: 'state' },
  { code: 'CA', name: 'California', capital: 'Sacramento', kind: 'state' },
  { code: 'CO', name: 'Colorado', capital: 'Denver', kind: 'state' },
  { code: 'CT', name: 'Connecticut', capital: 'Hartford', kind: 'state' },
  { code: 'DE', name: 'Delaware', capital: 'Dover', kind: 'state' },
  { code: 'FL', name: 'Florida', capital: 'Tallahassee', kind: 'state' },
  { code: 'GA', name: 'Georgia', capital: 'Atlanta', kind: 'state' },
  { code: 'HI', name: 'Hawaii', capital: 'Honolulu', kind: 'state' },
  { code: 'ID', name: 'Idaho', capital: 'Boise', kind: 'state' },
  { code: 'IL', name: 'Illinois', capital: 'Springfield', kind: 'state' },
  { code: 'IN', name: 'Indiana', capital: 'Indianapolis', kind: 'state' },
  { code: 'IA', name: 'Iowa', capital: 'Des Moines', kind: 'state' },
  { code: 'KS', name: 'Kansas', capital: 'Topeka', kind: 'state' },
  { code: 'KY', name: 'Kentucky', capital: 'Frankfort', kind: 'state' },
  { code: 'LA', name: 'Louisiana', capital: 'Baton Rouge', kind: 'state' },
  { code: 'ME', name: 'Maine', capital: 'Augusta', kind: 'state' },
  { code: 'MD', name: 'Maryland', capital: 'Annapolis', kind: 'state' },
  { code: 'MA', name: 'Massachusetts', capital: 'Boston', kind: 'state' },
  { code: 'MI', name: 'Michigan', capital: 'Lansing', kind: 'state' },
  { code: 'MN', name: 'Minnesota', capital: 'Saint Paul', kind: 'state' },
  { code: 'MS', name: 'Mississippi', capital: 'Jackson', kind: 'state' },
  { code: 'MO', name: 'Missouri', capital: 'Jefferson City', kind: 'state' },
  { code: 'MT', name: 'Montana', capital: 'Helena', kind: 'state' },
  { code: 'NE', name: 'Nebraska', capital: 'Lincoln', kind: 'state' },
  { code: 'NV', name: 'Nevada', capital: 'Carson City', kind: 'state' },
  { code: 'NH', name: 'New Hampshire', capital: 'Concord', kind: 'state' },
  { code: 'NJ', name: 'New Jersey', capital: 'Trenton', kind: 'state' },
  { code: 'NM', name: 'New Mexico', capital: 'Santa Fe', kind: 'state' },
  { code: 'NY', name: 'New York', capital: 'Albany', kind: 'state' },
  { code: 'NC', name: 'North Carolina', capital: 'Raleigh', kind: 'state' },
  { code: 'ND', name: 'North Dakota', capital: 'Bismarck', kind: 'state' },
  { code: 'OH', name: 'Ohio', capital: 'Columbus', kind: 'state' },
  { code: 'OK', name: 'Oklahoma', capital: 'Oklahoma City', kind: 'state' },
  { code: 'OR', name: 'Oregon', capital: 'Salem', kind: 'state' },
  { code: 'PA', name: 'Pennsylvania', capital: 'Harrisburg', kind: 'state' },
  { code: 'RI', name: 'Rhode Island', capital: 'Providence', kind: 'state' },
  { code: 'SC', name: 'South Carolina', capital: 'Columbia', kind: 'state' },
  { code: 'SD', name: 'South Dakota', capital: 'Pierre', kind: 'state' },
  { code: 'TN', name: 'Tennessee', capital: 'Nashville', kind: 'state' },
  { code: 'TX', name: 'Texas', capital: 'Austin', kind: 'state' },
  { code: 'UT', name: 'Utah', capital: 'Salt Lake City', kind: 'state' },
  { code: 'VT', name: 'Vermont', capital: 'Montpelier', kind: 'state' },
  { code: 'VA', name: 'Virginia', capital: 'Richmond', kind: 'state' },
  { code: 'WA', name: 'Washington', capital: 'Olympia', kind: 'state' },
  { code: 'WV', name: 'West Virginia', capital: 'Charleston', kind: 'state' },
  { code: 'WI', name: 'Wisconsin', capital: 'Madison', kind: 'state' },
  { code: 'WY', name: 'Wyoming', capital: 'Cheyenne', kind: 'state' },
  { code: 'DC', name: 'District of Columbia', capital: '', kind: 'dc' },
  { code: 'PR', name: 'Puerto Rico', capital: 'San Juan', kind: 'territory' },
  { code: 'GU', name: 'Guam', capital: 'Hagåtña', kind: 'territory' },
  { code: 'VI', name: 'U.S. Virgin Islands', capital: 'Charlotte Amalie', kind: 'territory' },
  { code: 'AS', name: 'American Samoa', capital: 'Pago Pago', kind: 'territory' },
  { code: 'MP', name: 'Northern Mariana Islands', capital: 'Saipan', kind: 'territory' },
];

export const placeByCode = (code: string): Place | undefined => PLACES.find((p) => p.code === code);
