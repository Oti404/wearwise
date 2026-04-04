declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.webp' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
}

declare module 'react-native-deck-swiper' {
  import { Component } from 'react';
  class Swiper<T> extends Component<any> {}
  export default Swiper;
}
