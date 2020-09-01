import * as React from "react";

function SvgBook(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <g data-name="Layer 2">
        <path
          d="M19 3H7a3 3 0 00-3 3v12a3 3 0 003 3h12a1 1 0 001-1V4a1 1 0 00-1-1zM7 19a1 1 0 010-2h11v2z"
          data-name="book"
        />
      </g>
    </svg>
  );
}

export default SvgBook;
