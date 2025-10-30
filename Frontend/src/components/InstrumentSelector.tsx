import { GiPianoKeys, GiGuitar, GiFlute } from 'react-icons/gi';

interface Instrument {
  id: 'piano' | 'guitar' | 'flute';
  name: string;
  icon: React.ReactNode;
}

interface InstrumentSelectorProps {
  currentInstrument: 'piano' | 'guitar' | 'flute';
}

const InstrumentSelector = ({ currentInstrument }: InstrumentSelectorProps) => {
  const instruments: Instrument[] = [
    { id: 'piano', name: 'Piano', icon: <GiPianoKeys /> },
    { id: 'guitar', name: 'Guitarra', icon: <GiGuitar /> },
    { id: 'flute', name: 'Flauta', icon: <GiFlute /> }
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="font-medium text-gray-700 mb-3">¿Qué instrumento practicaremos hoy?</h3>
      <div className="flex space-x-4">
        {instruments.map(instrument => (
          <button
            key={instrument.id}
            className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-colors ${
              currentInstrument === instrument.id 
                ? 'bg-indigo-100 border-2 border-indigo-300' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl mb-2">{instrument.icon}</span>
            <span>{instrument.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default InstrumentSelector;