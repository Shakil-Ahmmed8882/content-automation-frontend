/**
 * The slice of a react-query `useInfiniteQuery` result the infinite-scroll
 * module needs. The field names match react-query exactly, so a consumer can
 * pass the whole query object through with no destructuring or remapping.
 */
export interface InfiniteScrollQuery {
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}
