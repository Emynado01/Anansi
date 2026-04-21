interface SafePublicQueryResult<T> {
  data: T;
  failed: boolean;
}

export const safePublicQuery = async <T>(
  label: string,
  fallback: T,
  query: () => Promise<T>,
): Promise<SafePublicQueryResult<T>> => {
  try {
    return {
      data: await query(),
      failed: false,
    };
  } catch (error) {
    console.error(`Public query failed: ${label}`, error);
    return {
      data: fallback,
      failed: true,
    };
  }
};
