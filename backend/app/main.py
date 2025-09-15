import datetime

import MetaTrader5 as mt5
import pandas as pd


def fetch_mt5_data(symbol):
    mt5.initialize()
    from_date = datetime.datetime.now() - datetime.timedelta(days=365)
    to_date = datetime.datetime.now()
    rates = mt5.copy_rates_range(symbol, mt5.TIMEFRAME_M15, from_date, to_date)
    df = pd.DataFrame(rates)
    df.to_csv(f"{symbol}_15m_1year.csv", index=False)
    mt5.shutdown()


fetch_mt5_data("EURUSD")
