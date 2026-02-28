import React from 'react';

const NeoCard = ({
  imageSrc,
  imageAlt = 'thumbnail',
  date,
  title,
  description,
  href,
}) => {
  return (
    <div className="w-80 h-full border-black border-2 rounded-md hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-white">
      <a href={href} className="block cursor-pointer">
        <article className="w-full h-full">
          <figure className="w-full h-1/2 border-black border-b-2">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-full object-cover"
            />
          </figure>
          <div className="px-6 py-5 text-left h-full">
            <p className="text-base mb-4">{date}</p>
            <h1 className="text-[32px] mb-4">{title}</h1>
            <p className="text-xs mb-4 line-clamp-4">
              {description}
            </p>
            <strong>Read More</strong>
          </div>
        </article>
      </a>
    </div>
  );
};

export default NeoCard;