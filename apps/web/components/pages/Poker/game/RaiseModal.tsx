import { cn } from '@/lib/utils';
import React, { useState } from 'react';

interface RaiseModalProps {
  minRaise: number;
  maxRaise: number;
  raiseHandler: (raise: number) => void;
  isDisabled: boolean;
}
const buttonDisabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed';
const RaiseModal: React.FC<RaiseModalProps> = ({
  minRaise,
  maxRaise,
  raiseHandler,
  isDisabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [raise, setRaise] = useState(Math.round(10 * (minRaise + 10)) / 10);
  const [errors, setErrors] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleModal = () => setIsOpen(!isOpen);

  const validateRaise = (value: number) => {
    if (isNaN(value)) {
      setErrors('Invalid Amount');
      return false;
    }
    if (value >= maxRaise) {
      setErrors(`Not enough chips, remaining: ${maxRaise}`);
      return false;
    }
    if (value <= minRaise) {
      setErrors(`Has to be more than ${minRaise / 1000000000}`);
      return false;
    }
    setErrors(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateRaise(raise)) {
      setIsSubmitting(true);
      raiseHandler(raise);
      setIsSubmitting(false);
      toggleModal();
    }
  };

  return (
    <>
      <button
        onClick={toggleModal}
        className={cn(
          'group flex w-full cursor-pointer items-center justify-center lg:w-auto',
          'gap-[10px] rounded px-2 py-3 text-header-menu lg:py-1',
          ' transition duration-75 ease-in',
          ' lg:justify-normal',
          'bg-left-accent lg:bg-left-accent',
          'bg-left-accent text-black hover:opacity-80',
          'border border-bg-dark text-bg-dark hover:border-left-accent hover:bg-bg-dark hover:text-left-accent lg:text-black',
          'p-4 text-2xl',
          buttonDisabledStyle
        )}
        disabled={isDisabled}
      >
        Raise
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-80 rounded-lg bg-bg-dark p-6 text-center">
            <button
              onClick={toggleModal}
              className="absolute right-2 top-2 text-2xl text-foreground hover:text-middle-accent"
            >
              &times;
            </button>
            <h2 className="mb-4 text-xl text-foreground">Raise</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="number"
                  value={raise}
                  onChange={(e) => setRaise(parseFloat(e.target.value))}
                  className="w-3/4 rounded-lg border border-gray-600 bg-bg-grey p-2 text-lg text-foreground"
                />
              </div>
              {errors && <p className="mb-4 text-sm text-red-500">{errors}</p>}
              <div className="flex justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting || isDisabled}
                  className={`rounded-lg px-4 py-2 ${
                    isSubmitting
                      ? 'cursor-not-allowed bg-middle-accent'
                      : 'bg-middle-accent hover:bg-right-accent'
                  } text-dark-buttons-text`}
                >
                  {isSubmitting ? 'Raising...' : 'Raise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default RaiseModal;
